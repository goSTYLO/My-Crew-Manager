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


class AccountDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AccountDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']

        # Ensure the email matches the authenticated user
        if email != request.user.email.lower():
            return Response({'detail': 'email mismatch'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify password
        if not request.user.check_password(password):
            return Response({'detail': 'invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        # Delete auth token if exists
        try:
            request.user.auth_token.delete()
        except Exception:
            pass

        # Perform deletion
        user_id = request.user.user_id
        request.user.delete()
        return Response({'deleted': True, 'user_id': user_id}, status=status.HTTP_200_OK)
        
        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            return Response({
                'message': 'Password has been reset successfully'
            }, status=status.HTTP_200_OK)
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
        <div style="background:#f6f7fb;padding:24px 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="background:#ffffff;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,0.06);overflow:hidden;">
                  <tr>
                    <td style="background:#111827;color:#ffffff;padding:20px 24px;">
                      <div style="font-size:18px;font-weight:600;">My Crew Manager</div>
                      <div style="opacity:.8;font-size:12px;">Secure Email Verification</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 24px 8px 24px;">
                      <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Confirm your email</div>
                      <div style="font-size:14px;line-height:1.6;color:#4b5563;">
                        Use the code below to verify your email address. This code will expire in {settings.VERIFICATION_CODE_TTL_MIN} minutes.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 24px 4px 24px;">
                      <div style="background:#111827;color:#ffffff;text-align:center;border-radius:10px;padding:18px 0;font-size:28px;letter-spacing:6px;font-weight:700;">
                        {code}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 24px 20px 24px;">
                      <div style="font-size:12px;color:#6b7280;">
                        Didn’t request this? You can safely ignore this email.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f9fafb;padding:16px 24px;color:#6b7280;font-size:12px;border-top:1px solid #eef2f7;">
                      <div>Sent to {email}</div>
                      <div style="margin-top:4px;">&copy; {timezone.now().year} My Crew Manager. All rights reserved.</div>
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