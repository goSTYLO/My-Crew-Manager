from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSignupSerializer
from .serializers import UserSerializer

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
        serializer = UserSerializer(request.user)
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
            # Delete old profile picture if exists
            if user.profile_picture:
                try:
                    user.profile_picture.delete(save=False)
                except:
                    pass
            
            user.profile_picture = request.FILES['profile_picture']
        
        # Only update password if provided
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        try:
            user.save()
            serializer = UserSerializer(user)
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
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)