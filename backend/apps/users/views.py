from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import authenticate
from .models import User, EmailVerification
from .serializers import UserSignupSerializer
from .serializers import UserSerializer
from .serializers import EmailRequestSerializer, EmailVerifySerializer
from .serializers import AccountDeleteSerializer
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from datetime import timedelta
from django.db import transaction, connection, IntegrityError
from django.db.models.deletion import ProtectedError
from django.db.utils import OperationalError, ProgrammingError

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
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(email=email, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'id': str(user.user_id),
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'token': token.key,
                'role': user.role,
            })
        return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Logged out successfully"})
    
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