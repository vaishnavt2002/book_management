from rest_framework import serializers
from .models import CustomUser
from django.contrib.auth import authenticate
class UserRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email']
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(email=validated_data['email'], username=validated_data['username'], password = None )
        return user
    
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'email']

class OtpVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length = 6)
    password = serializers.CharField(
        write_only = True,
        min_length = 8,
    )
class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user and user.is_verified:
            return user
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_verified:
            raise serializers.ValidationError('Email not verified.')
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    is_verified = serializers.BooleanField(default=False)
    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'is_verified']