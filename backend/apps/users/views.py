import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import authenticate
from .models import User, EmailVerification, TwoFactorTempToken, RefreshToken
from .serializers import UserSignupSerializer
from .serializers import UserSerializer
from .serializers import EmailRequestSerializer, EmailVerifySerializer
from .serializers import AccountDeleteSerializer
from .serializers import (
    TwoFactorVerifySerializer, TwoFactorEnableSerializer,
    TwoFactorDisableSerializer, TwoFactorLoginVerifySerializer,
    ChangeEmailPasswordVerifySerializer, ChangeEmailRequestSerializer,
    ChangeEmailVerifySerializer
)
import pyotp
import secrets
import qrcode
from io import BytesIO
import base64
import hashlib
from cryptography.fernet import Fernet
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from datetime import timedelta
from django.db import transaction, connection, IntegrityError
from django.db.models.deletion import ProtectedError
from django.db.utils import OperationalError, ProgrammingError
import json


def _set_refresh_token_cookie(response, refresh_token, remember_me=False):
    """Helper function to set refresh token as HTTP-only cookie"""
    max_age = settings.REFRESH_TOKEN_COOKIE_AGE if remember_me else None  # Session cookie if not remember_me
    
    response.set_cookie(
        settings.REFRESH_TOKEN_COOKIE_NAME,
        refresh_token,
        max_age=max_age,
        httponly=settings.REFRESH_TOKEN_COOKIE_HTTPONLY,
        secure=settings.REFRESH_TOKEN_COOKIE_SECURE,
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
        path='/',
    )


def _create_refresh_token(user, remember_me, request=None):
    """Helper function to create a new refresh token"""
    # Delete expired refresh tokens for this user
    RefreshToken.objects.filter(user=user, expires_at__lt=timezone.now()).delete()
    
    # Generate new refresh token
    refresh_token_value = secrets.token_urlsafe(64)
    expires_at = timezone.now() + timedelta(days=30) if remember_me else timezone.now() + timedelta(hours=24)
    
    # Get IP and user agent if available
    ip_address = None
    user_agent = None
    if request:
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]  # Limit length
    
    refresh_token = RefreshToken.objects.create(
        user=user,
        token=refresh_token_value,
        expires_at=expires_at,
        remember_me=remember_me,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return refresh_token.token


class SignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'id': str(user.user_id),
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'token': token.key,
                'role': user.role,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    logger = logging.getLogger('apps.users')

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        remember_me = request.data.get('remember_me', False)
        
        # Log login attempt
        self.logger.info(f'🔐 Login attempt from IP: {self._get_client_ip(request)}, Email: {email}')
        self.logger.debug(f'Request headers: {dict(request.headers)}')
        self.logger.debug(f'Request data keys: {list(request.data.keys())}')
        
        user = authenticate(email=email, password=password)
        if user:
            # Check if 2FA is enabled (using getattr in case migration hasn't been run)
            if getattr(user, 'two_factor_enabled', False):
                # Generate temporary token for 2FA verification
                temp_token = secrets.token_urlsafe(32)
                expires_at = timezone.now() + timedelta(minutes=5)
                
                # Delete any existing temp tokens for this user
                TwoFactorTempToken.objects.filter(user=user).delete()
                
                # Store remember_me in session or temp token for later use
                # For now, we'll handle it in Verify2FALoginView
                TwoFactorTempToken.objects.create(
                    user=user,
                    token=temp_token,
                    expires_at=expires_at
                )
                
                response = Response({
                    'requires_2fa': True,
                    'temp_token': temp_token,
                    'message': 'Please enter your 2FA code'
                })
                
                # Store remember_me flag temporarily in a secure way
                # We'll pass it through the temp_token verification
                return response
            else:
                # Normal login flow
                token, created = Token.objects.get_or_create(user=user)
                response = Response({
                    'id': str(user.user_id),
                    'email': user.email,
                    'name': user.name,
                    'role': user.role,
                    'token': token.key,
                    'role': user.role,
                })
                
                # Create refresh token and set cookie if remember_me is True
                if remember_me:
                    refresh_token = _create_refresh_token(user, remember_me=True, request=request)
                    _set_refresh_token_cookie(response, refresh_token, remember_me=True)
                
                self.logger.info(f'✅ Login successful for user: {user.email}, User ID: {user.user_id}')
                return response
        self.logger.warning(f'❌ Login failed - Invalid credentials for email: {email}, IP: {self._get_client_ip(request)}')
        return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
    
    def _get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]


    def post(self, request):
        user = request.user
        
        # Delete auth token
        try:
            request.user.auth_token.delete()
        except:
            pass  # Token might not exist
        
        # Delete all refresh tokens for this user
        RefreshToken.objects.filter(user=user).delete()
        
        # Create response and clear refresh token cookie
        response = Response({"message": "Logged out successfully"})
        response.delete_cookie(
            settings.REFRESH_TOKEN_COOKIE_NAME,
            path='/'
        )
        
        return response


class RefreshTokenView(APIView):
    """Refresh access token using refresh token from cookie"""
    
    def post(self, request):
        # Get refresh token from cookie
        refresh_token_value = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE_NAME)
        
        if not refresh_token_value:
            return Response(
                {'error': 'No refresh token found'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Find refresh token in database
        now = timezone.now()
        refresh_token_obj = RefreshToken.objects.filter(
            token=refresh_token_value,
            expires_at__gt=now
        ).first()
        
        if not refresh_token_obj:
            # Token expired or invalid - clear cookie
            response = Response(
                {'error': 'Refresh token expired or invalid'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            response.delete_cookie(
                settings.REFRESH_TOKEN_COOKIE_NAME,
                path='/'
            )
            return response
        
        user = refresh_token_obj.user
        
        # Create or get access token
        token, created = Token.objects.get_or_create(user=user)
        
        # Optionally rotate refresh token for security (create new one, delete old)
        # For now, we'll keep the same refresh token until it expires
        # Uncomment below for token rotation:
        # refresh_token_obj.delete()
        # new_refresh_token = _create_refresh_token(user, refresh_token_obj.remember_me, request)
        # response = Response({
        #     'token': token.key,
        #     'id': str(user.user_id),
        #     'email': user.email,
        #     'name': user.name,
        #     'role': user.role,
        # })
        # _set_refresh_token_cookie(response, new_refresh_token, refresh_token_obj.remember_me)
        # return response
        
        return Response({
            'token': token.key,
            'id': str(user.user_id),
            'email': user.email,
            'name': user.name,
            'role': user.role,
        })
    
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        """Update user profile including profile picture"""
        user = request.user
        data = request.data
        
        # Update fields if provided
        if 'name' in data:
            user.name = data['name']
        
        if 'email' in data:
            # Check if email is already taken by another user
            if User.objects.filter(email=data['email']).exclude(user_id=user.user_id).exists():
                return Response(
                    {'error': 'Email already in use by another account'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.email = data['email']
        
        if 'role' in data:
            user.role = data['role']
        
        # Handle profile picture upload
        if 'profile_picture' in request.FILES:
            user.profile_picture = request.FILES['profile_picture']
        
        # Only update password if provided
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        try:
            user.save()
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get email query parameter
        email = request.query_params.get('email')
        
        # Filter by email if provided
        if email:
            users = User.objects.filter(email=email)
        else:
            users = User.objects.all()
        
        serializer = UserSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)



class AccountDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AccountDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']

        # Ensure the email matches the authenticated user
        if email != request.user.email.lower():
            return Response(
                {'error': 'Email does not match your account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify password
        if not request.user.check_password(password):
            return Response(
                {'error': 'Incorrect password. Please try again.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            with transaction.atomic():
                user_id = request.user.user_id
                
                # Delete auth token
                try:
                    request.user.auth_token.delete()
                except Exception:
                    pass
                
                # Attempt hard delete in its own savepoint; on failure, perform soft delete in a clean savepoint
                soft_deleted = False
                try:
                    with transaction.atomic():
                        request.user.delete()
                except (ProgrammingError, IntegrityError, ProtectedError) as e:
                    print(f"Hard delete failed, performing soft-delete: {e}")
                    with transaction.atomic():
                        user = request.user
                        update_fields = []
                        if hasattr(user, 'is_active'):
                            user.is_active = False
                            update_fields.append('is_active')
                        if hasattr(user, 'email') and user.email:
                            user.email = f"deleted_{user.user_id}@example.invalid"
                            update_fields.append('email')
                        if hasattr(user, 'name') and user.name:
                            user.name = "Deleted User"
                            update_fields.append('name')
                        if update_fields:
                            user.save(update_fields=update_fields)
                            soft_deleted = True

                return Response(
                    {
                        'deleted': True,
                        'soft_deleted': soft_deleted,
                        'user_id': str(user_id),
                        'message': 'Account deleted successfully'
                    },
                    status=status.HTTP_200_OK
                )
                
        except ProtectedError as e:
            # There are related objects protected by FK constraints
            return Response(
                {
                    'error': 'Account cannot be deleted due to linked records. Please remove or reassign related data first.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError as e:
            # Database integrity prevents deletion (e.g., NOT NULL FK)
            return Response(
                {
                    'error': 'Account cannot be deleted due to database constraints. Please contact support.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            print("Delete error:", traceback.format_exc())
            return Response(
                {'error': 'Unable to delete account. Please contact support.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PasswordResetView(APIView):
    # No permission_classes, so it's accessible without authentication
    
    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('password')
        
        if not email or not new_password:
            return Response(
                {'error': 'Email and password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response(
                {'message': 'Password has been reset successfully'}, 
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'No account found with this email address'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class EmailRequestView(APIView):
    def post(self, request):
        serializer = EmailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()

        now = timezone.now()
        last = EmailVerification.objects.filter(email=email, status='PENDING').order_by('-created_at').first()
        if last and (now - last.last_sent_at).total_seconds() < settings.VERIFICATION_RESEND_COOLDOWN_SEC:
            return Response(status=status.HTTP_204_NO_CONTENT)

        code = f"{__import__('random').randint(100000, 999999)}"
        code_hash = make_password(code)
        expires_at = now + timedelta(minutes=settings.VERIFICATION_CODE_TTL_MIN)

        EmailVerification.objects.create(
            email=email,
            code_hash=code_hash,
            expires_at=expires_at,
            attempts=0,
            status='PENDING',
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
        )

        subject = 'Verify your email for My Crew Manager'
        message = (
            f"Your My Crew Manager verification code is {code}. "
            f"It expires in {settings.VERIFICATION_CODE_TTL_MIN} minutes."
        )
        html_message = f"""
        <div style="background:#f8f9fc;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;color:#1f2937;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background:#ffffff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.1);overflow:hidden;border:1px solid #e5e7eb;">
                    
                    <!-- Header with Logo and Branding -->
                    <tr>
                        <td style="background:linear-gradient(135deg, #1a5f7a 0%, #2c7a9e 100%);color:#ffffff;padding:40px 40px 36px 40px;text-align:center;">
                        <div style="font-size:32px;font-weight:700;letter-spacing:-1px;margin-bottom:8px;">MyCrewManager</div>
                        <div style="opacity:.95;font-size:14px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Email Verification Service</div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding:48px 40px 24px 40px;">
                        <div style="text-align:center;margin-bottom:32px;">
                            <div style="display:inline-block;background:#f0f9ff;color:#1a5f7a;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:20px;">
                            Action Required
                            </div>
                        </div>
                        <div style="font-size:24px;font-weight:700;margin-bottom:16px;color:#111827;line-height:1.3;">Email Verification Required</div>
                        <div style="font-size:15px;line-height:1.8;color:#4b5563;margin-bottom:8px;">
                            Thank you for registering with MyCrewManager. To ensure the security of your account and complete your registration, please verify your email address using the code provided below.
                        </div>
                        <div style="font-size:14px;line-height:1.7;color:#6b7280;">
                            This verification code will remain valid for <strong style="color:#1a5f7a;">{settings.VERIFICATION_CODE_TTL_MIN} minutes</strong> from the time of this email.
                        </div>
                        </td>
                    </tr>
                    
                    <!-- Verification Code -->
                    <tr>
                        <td style="padding:16px 40px 24px 40px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                            <td align="center">
                                <div style="background:linear-gradient(135deg, #1a5f7a 0%, #2c7a9e 100%);border-radius:12px;padding:32px 40px;box-shadow:0 6px 20px rgba(26,95,122,0.2);">
                                <div style="color:#ffffff;opacity:0.9;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Verification Code</div>
                                <div style="color:#ffffff;font-size:36px;letter-spacing:10px;font-weight:700;font-family:Consolas,Monaco,Courier New,monospace;">
                                    {code}
                                </div>
                                </div>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    
                    <!-- Instructions -->
                    <tr>
                        <td style="padding:16px 40px 32px 40px;">
                        <div style="background:#f9fafb;border-left:4px solid #1a5f7a;padding:20px 24px;border-radius:8px;">
                            <div style="font-size:14px;font-weight:600;color:#111827;margin-bottom:8px;">Important Security Information</div>
                            <div style="font-size:13px;line-height:1.7;color:#4b5563;">
                            • Enter this code in the verification page to confirm your email address<br>
                            • Never share this code with anyone, including MyCrewManager staff<br>
                            • If you did not create an account, please disregard this message
                            </div>
                        </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f9fafb;padding:32px 40px;border-top:1px solid #e5e7eb;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                            <td style="padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
                                <div style="font-size:13px;color:#6b7280;line-height:1.6;">
                                <strong style="color:#374151;display:block;margin-bottom:4px;">This email was sent to:</strong>
                                {email}
                                </div>
                            </td>
                            </tr>
                            <tr>
                            <td style="padding-top:16px;">
                                <div style="font-size:12px;color:#9ca3af;line-height:1.7;">
                                This is an automated message from MyCrewManager's secure authentication system. Please do not reply directly to this email. For support inquiries, please visit our help center.
                                </div>
                                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
                                &copy; {timezone.now().year} MyCrewManager. All rights reserved.<br>
                                <span style="opacity:0.8;">Trusted workforce management solutions.</span>
                                </div>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    
                    </table>
                </td>
                </tr>
            </table>
        </div>
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], html_message=html_message)
        except Exception:
            # Do not leak mail errors to clients; consider logging in production
            pass

        return Response(status=status.HTTP_204_NO_CONTENT)


class EmailVerifyView(APIView):
    def post(self, request):
        serializer = EmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        code = serializer.validated_data['code']

        now = timezone.now()
        rec = EmailVerification.objects.filter(email=email, status='PENDING').order_by('-created_at').first()
        if not rec:
            return Response({'detail': 'invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

        if rec.expires_at <= now:
            rec.status = 'EXPIRED'
            rec.save(update_fields=['status'])
            return Response({'detail': 'invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

        if rec.attempts >= settings.VERIFICATION_MAX_ATTEMPTS:
            rec.status = 'LOCKED'
            rec.save(update_fields=['status'])
            return Response({'detail': 'too many attempts'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        if not check_password(code, rec.code_hash):
            rec.attempts = rec.attempts + 1
            rec.save(update_fields=['attempts'])
            return Response({'detail': 'invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

        rec.status = 'VERIFIED'
        rec.save(update_fields=['status'])

        try:
            user = User.objects.get(email=email)
            if not user.email_verified_at:
                user.email_verified_at = now
                user.save(update_fields=['email_verified_at'])
        except User.DoesNotExist:
            pass

        return Response({'verified': True})


class ChangeEmailPasswordVerifyView(APIView):
    """Step 1: Verify user's password before allowing email change"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangeEmailPasswordVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data['password']

        # Verify password
        if not request.user.check_password(password):
            return Response(
                {'error': 'Incorrect password. Please try again.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response({'verified': True}, status=status.HTTP_200_OK)


class ChangeEmailRequestView(APIView):
    """Step 2: Request email change - send OTP to new email"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangeEmailRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data['new_email'].strip().lower()

        # Check if new email is the same as current email
        if new_email == request.user.email.lower():
            return Response(
                {'error': 'New email must be different from your current email'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if new email is already taken
        if User.objects.filter(email=new_email).exclude(user_id=request.user.user_id).exists():
            return Response(
                {'error': 'This email address is already registered to another account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check cooldown period
        now = timezone.now()
        last = EmailVerification.objects.filter(email=new_email, status='PENDING').order_by('-created_at').first()
        if last and (now - last.last_sent_at).total_seconds() < settings.VERIFICATION_RESEND_COOLDOWN_SEC:
            return Response(
                {'error': f'Please wait {settings.VERIFICATION_RESEND_COOLDOWN_SEC} seconds before requesting a new code'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Generate and send verification code
        code = f"{__import__('random').randint(100000, 999999)}"
        code_hash = make_password(code)
        expires_at = now + timedelta(minutes=settings.VERIFICATION_CODE_TTL_MIN)

        EmailVerification.objects.create(
            email=new_email,
            code_hash=code_hash,
            expires_at=expires_at,
            attempts=0,
            status='PENDING',
            ip=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
        )

        # Send email with OTP
        subject = 'Verify your new email address for My Crew Manager'
        message = (
            f"Your My Crew Manager email change verification code is {code}. "
            f"It expires in {settings.VERIFICATION_CODE_TTL_MIN} minutes. "
            f"If you did not request this change, please ignore this email."
        )
        html_message = f"""
        <div style="background:#f8f9fc;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;color:#1f2937;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="background:#ffffff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.1);overflow:hidden;border:1px solid #e5e7eb;">
                    
                    <!-- Header with Logo and Branding -->
                    <tr>
                        <td style="background:linear-gradient(135deg, #1a5f7a 0%, #2c7a9e 100%);color:#ffffff;padding:40px 40px 36px 40px;text-align:center;">
                        <div style="font-size:32px;font-weight:700;letter-spacing:-1px;margin-bottom:8px;">MyCrewManager</div>
                        <div style="opacity:.95;font-size:14px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Email Change Verification</div>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding:48px 40px 24px 40px;">
                        <div style="text-align:center;margin-bottom:32px;">
                            <div style="display:inline-block;background:#f0f9ff;color:#1a5f7a;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:20px;">
                            Action Required
                            </div>
                        </div>
                        <div style="font-size:24px;font-weight:700;margin-bottom:16px;color:#111827;line-height:1.3;">Email Change Verification</div>
                        <div style="font-size:15px;line-height:1.8;color:#4b5563;margin-bottom:8px;">
                            A request has been made to change your email address to <strong style="color:#1a5f7a;">{new_email}</strong>. To complete this change, please verify your new email address using the code provided below.
                        </div>
                        <div style="font-size:14px;line-height:1.7;color:#6b7280;">
                            This verification code will remain valid for <strong style="color:#1a5f7a;">{settings.VERIFICATION_CODE_TTL_MIN} minutes</strong> from the time of this email.
                        </div>
                        </td>
                    </tr>
                    
                    <!-- Verification Code -->
                    <tr>
                        <td style="padding:16px 40px 24px 40px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                            <td align="center">
                                <div style="background:linear-gradient(135deg, #1a5f7a 0%, #2c7a9e 100%);border-radius:12px;padding:32px 40px;box-shadow:0 6px 20px rgba(26,95,122,0.2);">
                                <div style="color:#ffffff;opacity:0.9;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Verification Code</div>
                                <div style="color:#ffffff;font-size:36px;letter-spacing:10px;font-weight:700;font-family:Consolas,Monaco,Courier New,monospace;">
                                    {code}
                                </div>
                                </div>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    
                    <!-- Instructions -->
                    <tr>
                        <td style="padding:16px 40px 32px 40px;">
                        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:20px 24px;border-radius:8px;">
                            <div style="font-size:14px;font-weight:600;color:#92400e;margin-bottom:8px;">Important Security Information</div>
                            <div style="font-size:13px;line-height:1.7;color:#78350f;">
                            • Enter this code in the email change verification page<br>
                            • If you did not request this email change, please ignore this message and consider changing your account password<br>
                            • Never share this code with anyone, including MyCrewManager staff
                            </div>
                        </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f9fafb;padding:32px 40px;border-top:1px solid #e5e7eb;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                            <td style="padding-bottom:16px;border-bottom:1px solid #e5e7eb;">
                                <div style="font-size:13px;color:#6b7280;line-height:1.6;">
                                <strong style="color:#374151;display:block;margin-bottom:4px;">This email was sent to:</strong>
                                {new_email}
                                </div>
                            </td>
                            </tr>
                            <tr>
                            <td style="padding-top:16px;">
                                <div style="font-size:12px;color:#9ca3af;line-height:1.7;">
                                This is an automated message from MyCrewManager's secure authentication system. Please do not reply directly to this email. For support inquiries, please visit our help center.
                                </div>
                                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
                                &copy; {timezone.now().year} MyCrewManager. All rights reserved.<br>
                                <span style="opacity:0.8;">Trusted workforce management solutions.</span>
                                </div>
                            </td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    
                    </table>
                </td>
                </tr>
            </table>
        </div>
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [new_email], html_message=html_message)
        except Exception as e:
            # Log error but don't leak it to clients
            print(f"Failed to send email change verification: {e}")
            return Response(
                {'error': 'Failed to send verification email. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({'message': 'Verification code sent to your new email address'}, status=status.HTTP_200_OK)


class ChangeEmailVerifyView(APIView):
    """Step 3: Verify OTP and update email"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangeEmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data['new_email'].strip().lower()
        code = serializer.validated_data['code']

        # Verify that this email change was requested by checking EmailVerification record
        now = timezone.now()
        rec = EmailVerification.objects.filter(email=new_email, status='PENDING').order_by('-created_at').first()
        
        if not rec:
            return Response(
                {'error': 'No verification code found for this email. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if rec.expires_at <= now:
            rec.status = 'EXPIRED'
            rec.save(update_fields=['status'])
            return Response(
                {'error': 'Verification code has expired. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if rec.attempts >= settings.VERIFICATION_MAX_ATTEMPTS:
            rec.status = 'LOCKED'
            rec.save(update_fields=['status'])
            return Response(
                {'error': 'Too many attempts. Please request a new code.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        if not check_password(code, rec.code_hash):
            rec.attempts = rec.attempts + 1
            rec.save(update_fields=['attempts'])
            return Response(
                {'error': 'Invalid verification code. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if new email is already taken (double check)
        if User.objects.filter(email=new_email).exclude(user_id=request.user.user_id).exists():
            rec.status = 'VERIFIED'  # Mark as verified even though we'll reject
            rec.save(update_fields=['status'])
            return Response(
                {'error': 'This email address is already registered to another account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark verification as verified and update user email
        rec.status = 'VERIFIED'
        rec.save(update_fields=['status'])

        # Update user email
        old_email = request.user.email
        request.user.email = new_email
        request.user.email_verified_at = now  # Mark new email as verified
        request.user.save(update_fields=['email', 'email_verified_at'])

        # Update all EmailVerification records for the old email to prevent confusion
        EmailVerification.objects.filter(email=old_email.lower(), status='PENDING').update(status='CANCELLED')

        return Response({
            'message': 'Email address updated successfully',
            'new_email': new_email
        }, status=status.HTTP_200_OK)


class Get2FAStatusView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            
            # Check if 2FA fields exist (in case migration hasn't been run)
            if not hasattr(user, 'two_factor_enabled'):
                return Response(
                    {'error': '2FA fields not found in database. Please run migrations: python manage.py makemigrations && python manage.py migrate'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            response_data = {
                'enabled': getattr(user, 'two_factor_enabled', False)
            }
            
            if not response_data['enabled']:
                # Generate secret and QR code for setup
                secret = pyotp.random_base32()
                totp = pyotp.TOTP(secret)
                
                # Create provisioning URI
                provisioning_uri = totp.provisioning_uri(
                    name=user.email,
                    issuer_name='MyCrewManager'
                )
                
                # Generate QR code as base64
                qr = qrcode.QRCode(version=1, box_size=10, border=5)
                qr.add_data(provisioning_uri)
                qr.make(fit=True)
                img = qr.make_image(fill_color="black", back_color="white")
                
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
                
                response_data['qr_code'] = f"data:image/png;base64,{qr_code_base64}"
                response_data['secret'] = secret
                response_data['provisioning_uri'] = provisioning_uri
            
            return Response(response_data)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in Get2FAStatusView: {str(e)}")
            print(error_trace)
            return Response(
                {'error': f'Failed to get 2FA status: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def _get_encryption_fernet():
    """Get Fernet instance for encrypting/decrypting 2FA secrets"""
    from django.conf import settings
    # Derive encryption key from SECRET_KEY
    key_material = settings.SECRET_KEY.encode()
    key = base64.urlsafe_b64encode(hashlib.sha256(key_material).digest())
    return Fernet(key)


def _encrypt_secret(secret):
    """Encrypt a secret using Fernet"""
    f = _get_encryption_fernet()
    return f.encrypt(secret.encode()).decode()


def _decrypt_secret(encrypted_secret):
    """Decrypt a secret using Fernet"""
    f = _get_encryption_fernet()
    return f.decrypt(encrypted_secret.encode()).decode()


class Enable2FAView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            user = request.user
            
            # Check if 2FA fields exist (in case migration hasn't been run)
            if not hasattr(user, 'two_factor_enabled'):
                return Response(
                    {'error': '2FA fields not found in database. Please run migrations: python manage.py makemigrations && python manage.py migrate'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            if getattr(user, 'two_factor_enabled', False):
                return Response(
                    {'error': '2FA is already enabled'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate secret and QR code
            secret = pyotp.random_base32()
            totp = pyotp.TOTP(secret)
            
            # Create provisioning URI
            provisioning_uri = totp.provisioning_uri(
                name=user.email,
                issuer_name='MyCrewManager'
            )
            
            # Generate QR code as base64
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(provisioning_uri)
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Store secret encrypted temporarily (will be enabled after verification)
            encrypted_secret = _encrypt_secret(secret)
            user.two_factor_secret = encrypted_secret
            user.save(update_fields=['two_factor_secret'])
            
            return Response({
                'qr_code': f"data:image/png;base64,{qr_code_base64}",
                'secret': secret,
                'provisioning_uri': provisioning_uri,
                'message': 'Scan the QR code with your authenticator app and verify with a code'
            })
        except AttributeError as e:
            return Response(
                {'error': f'Database fields missing. Please run migrations: python manage.py makemigrations && python manage.py migrate. Error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error in Enable2FAView: {str(e)}")
            print(error_trace)
            return Response(
                {'error': f'Failed to enable 2FA: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class Verify2FASetupView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = TwoFactorVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        
        user = request.user
        
        if not user.two_factor_secret:
            return Response(
                {'error': 'No 2FA setup in progress. Please enable 2FA first.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decrypt the stored secret
        try:
            decrypted_secret = _decrypt_secret(user.two_factor_secret)
        except Exception as e:
            return Response(
                {'error': 'Unable to retrieve secret. Please start 2FA setup again.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        totp = pyotp.TOTP(decrypted_secret)
        if totp.verify(code, valid_window=1):
            # Verification successful - enable 2FA (secret is already stored encrypted)
            user.two_factor_enabled = True
            user.save(update_fields=['two_factor_enabled'])
            
            return Response({
                'message': '2FA has been enabled successfully',
                'enabled': True
            })
        else:
            return Response(
                {'error': 'Invalid verification code'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class Disable2FAView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = TwoFactorDisableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data['password']
        
        user = request.user
        
        if not user.two_factor_enabled:
            return Response(
                {'error': '2FA is not enabled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify password
        if not user.check_password(password):
            return Response(
                {'error': 'Incorrect password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Disable 2FA and clear secret
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.save(update_fields=['two_factor_enabled', 'two_factor_secret'])
        
        return Response({
            'message': '2FA has been disabled successfully',
            'enabled': False
        })


class Verify2FALoginView(APIView):
    def post(self, request):
        serializer = TwoFactorLoginVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        temp_token = serializer.validated_data['temp_token']
        code = serializer.validated_data['code']
        
        # Find temp token
        now = timezone.now()
        temp_token_obj = TwoFactorTempToken.objects.filter(
            token=temp_token,
            expires_at__gt=now
        ).first()
        
        if not temp_token_obj:
            return Response(
                {'error': 'Invalid or expired temporary token'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = temp_token_obj.user
        
        # Verify 2FA code
        if not user.two_factor_enabled or not user.two_factor_secret:
            temp_token_obj.delete()
            return Response(
                {'error': '2FA is not enabled for this account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decrypt the stored secret
        try:
            decrypted_secret = _decrypt_secret(user.two_factor_secret)
            totp = pyotp.TOTP(decrypted_secret)
        except Exception as e:
            return Response(
                {'error': 'Unable to verify code. Please disable and re-enable 2FA.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        if totp.verify(code, valid_window=1):
            # Verification successful
            # Delete temp token
            temp_token_obj.delete()
            
            # Get remember_me from request (passed from frontend)
            remember_me = request.data.get('remember_me', False)
            
            # Create permanent auth token
            token, created = Token.objects.get_or_create(user=user)
            
            response = Response({
                'id': str(user.user_id),
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'token': token.key,
            })
            
            # Create refresh token and set cookie if remember_me is True
            if remember_me:
                refresh_token = _create_refresh_token(user, remember_me=True, request=request)
                _set_refresh_token_cookie(response, refresh_token, remember_me=True)
            
            return response
        else:
            return Response(
                {'error': 'Invalid verification code'}, 
                status=status.HTTP_400_BAD_REQUEST
            )