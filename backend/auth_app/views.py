import random
from django.conf import settings
from django.shortcuts import render
from rest_framework.views import APIView
from django.core.cache import cache
from auth_app.serializers import *
from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
import logging
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
logger = logging.getLogger(__name__)
# Create your views here.
class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):

        serializer = UserRegisterSerializer(data= request.data)
        if serializer.is_valid():
            user = serializer.save()
            otp = str(random.randint(100000,999999))
            cache.set(f'otp_{user.email}',otp,timeout=600)
            try:
                send_mail(
                    subject='Your OTP for Our Application',
                    message=f'Your OTP for registration is {otp}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                return Response({
                    'user': UserRegisterSerializer(user).data,
                    'message': 'User registration successful. Now verify using OTP'
                })
            except Exception as e:
                logger.error(f"Failed to send email: {str(e)}")
                return Response({
                    'user': serializers.UserRegisterSerializer(user).data,
                    'message': 'User registered, but failed to send OTP email'
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status= status.HTTP_400_BAD_REQUEST)
    
class OtpVerifyView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OtpVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            password = serializer.validated_data['password']
            try:
                user = CustomUser.objects.get(email=email)
                cached_otp = cache.get(f'otp_{email}')
                if cached_otp and cached_otp == code:
                    cache.delete(f'otp_{email}')
                    user.is_verified = True
                    user.set_password(password)
                    user.save()
                    return Response({'user':UserProfileSerializer(user).data,'message':'The user is verified successfully'},status=status.HTTP_200_OK)
                return Response({'error':'OTP is not matching or expired'},status=status.HTTP_400_BAD_REQUEST)
            except CustomUser.DoesNotExist:
                return Response({'error':'User does not exist'},status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)

class OtpRequestView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OtpVerifySerializer(data = request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email = email)
                otp = str(random.randint(100000,999999))
                cache.set(f'otp_{email}', otp, timeout=600)
                send_mail(
                    subject='Your OTP for Book Management Verification',
                    message=f'Your OTP is: {otp}. It is valid for 10 minutes.',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                return Response({'message': 'OTP sent to email.'}, status=status.HTTP_200_OK)
            except CustomUser.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            refresh = RefreshToken.for_user(user)
            response = Response({
                'user': UserProfileSerializer(user).data,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=False,
                samesite='Lax'
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                httponly=True,
                secure=False,
                samesite='Lax'
            )
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({'detail': 'Refresh token not found in cookies'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        access_token = serializer.validated_data.get('access')
        response = Response({'access': access_token})

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=False, 
            samesite='Lax'
        )
        return response