from rest_framework import serializers
from .models import CustomUser

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
