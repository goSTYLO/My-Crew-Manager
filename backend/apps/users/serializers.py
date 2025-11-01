from rest_framework import serializers
from .models import User
from rest_framework import serializers

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
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User 
        fields = ['user_id', 'name', 'email', 'role', 'profile_picture']
    
    def get_profile_picture(self, obj):
        """Return full URL for profile picture"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.profile_picture.url)
            # Fallback if request context is not available
            return obj.profile_picture.url
        return None


class EmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class EmailVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(regex=r'^\d{6}$')


class AccountDeleteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class TwoFactorVerifySerializer(serializers.Serializer):
    code = serializers.RegexField(regex=r'^\d{6}$', help_text='6-digit verification code')


class TwoFactorEnableSerializer(serializers.Serializer):
    code = serializers.RegexField(regex=r'^\d{6}$', required=False, help_text='6-digit verification code for initial setup')


class TwoFactorDisableSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class TwoFactorLoginVerifySerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    code = serializers.RegexField(regex=r'^\d{6}$', help_text='6-digit verification code')