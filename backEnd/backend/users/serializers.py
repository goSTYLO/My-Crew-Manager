from rest_framework import serializers
from .models import User

class UserSignupSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        error_messages={
            'invalid': 'Enter a valid email address.',
            'blank': 'Email cannot be blank.'
        }
    )

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'role', 'profile_picture']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User 
        fields = ['id', 'name', 'email', 'role']
