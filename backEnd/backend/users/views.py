from pickle import GET
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from django.db import IntegrityError
from .models import User
from .serializers import UserSignupSerializer
from .serializers import UserSerializer


class SignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(
                    {"message": "User created successfully"},
                    status=status.HTTP_201_CREATED
                )
            except IntegrityError:
                return Response(
                    {"error": "A user with this email already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(email=email, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Logged out successfully"})
    
class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


#   http://127.0.0.1:8000/api/users/(login,signup,logout)/ <- endpoints
#   GET http://127.0.0.1:8000/api/users/all/ for fetching all users
#   GET http://127.0.0.1:8000/api/users/me/ for fetching user details   
#   JSON parameters
#   LOGIN
#   {
#       "email": "user@example.com",
#       "password": "yourpassword"
#   }
#   Signup
#   {
#       "name": "Your Name",
#       "email": "user@example.com",
#       "password": "yourpassword"
#   }
#   LOGOUT {
#      Headers
#      Authorization: Token <your_token>
#  }
#
#