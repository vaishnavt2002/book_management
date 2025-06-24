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
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        try:
            existing_user = CustomUser.objects.get(email=email)
            if existing_user.is_verified:
                return Response({
                    'error': 'User with this email is already registered and verified'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            else:
                logger.info(f"Updating existing unverified user: {email}")
                serializer = UserRegisterSerializer(existing_user, data=request.data, partial=True)
                if serializer.is_valid():
                    user = serializer.save()
                    otp = str(random.randint(100000, 999999))
                    cache.set(f'otp_{user.email}_register', otp, timeout=600)
                    
                    try:
                        send_mail(
                            subject='Your OTP for Our Application',
                            message=f'Your OTP for registration is {otp}',
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[user.email],
                            fail_silently=False,
                        )
                        logger.info(f"OTP sent successfully for user: {user.email}")
                        return Response({
                            'user': UserRegisterSerializer(user).data,
                            'message': 'User information updated. Please verify using OTP'
                        }, status=status.HTTP_200_OK)
                    except Exception as e:
                        logger.error(f"Failed to send email for user {user.email}: {str(e)}")
                        return Response({
                            'user': UserRegisterSerializer(user).data,
                            'message': 'User information updated, but failed to send OTP email'
                        }, status=status.HTTP_200_OK)
                else:
                    logger.error(f"User update validation failed for {email}: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                    
        except CustomUser.DoesNotExist:
            serializer = UserRegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                otp = str(random.randint(100000, 999999))
                cache.set(f'otp_{user.email}_register', otp, timeout=600)
                
                try:
                    send_mail(
                        subject='Your OTP for Our Application',
                        message=f'Your OTP for registration is {otp}',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                    logger.info(f"OTP sent successfully for new user: {user.email}")
                    return Response({
                        'user': UserRegisterSerializer(user).data,
                        'message': 'User registration successful. Now verify using OTP'
                    }, status=status.HTTP_201_CREATED)
                except Exception as e:
                    logger.error(f"Failed to send OTP email for new user {user.email}: {str(e)}")
                    return Response({
                        'user': UserRegisterSerializer(user).data,
                        'message': 'User registered, but failed to send OTP email'
                    }, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"User registration validation failed for {email}: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
                cached_otp = cache.get(f'otp_{email}_register')
                if cached_otp and cached_otp == code:
                    cache.delete(f'otp_{email}_register')
                    user.is_verified = True
                    user.set_password(password)
                    user.save()
                    logger.info(f"User {email} verified successfully")
                    return Response({
                        'user': UserProfileSerializer(user).data,
                        'message': 'The user is verified successfully'
                    }, status=status.HTTP_200_OK)
                logger.warning(f"Invalid or expired OTP for user {email}")
                return Response({
                    'error': 'OTP is not matching or expired'
                }, status=status.HTTP_400_BAD_REQUEST)
            except CustomUser.DoesNotExist:
                logger.error(f"User not found for OTP verification: {email}")
                return Response({
                    'error': 'User does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"OTP verification data invalid: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OtpRequestView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email=email)
                otp = str(random.randint(100000, 999999))
                context = request.data.get('context', 'register')
                cache_key = f'otp_{email}_{context}'
                cache.set(cache_key, otp, timeout=600)
                subject = (
                    'Your OTP for Registration' if context == 'register'
                    else 'Your OTP for Password Reset'
                )
                message = f'Your OTP is: {otp}. It is valid for 10 minutes.'
                try:
                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                    )
                    logger.info(f"OTP sent successfully for {context} to {email}")
                    return Response({
                        'message': 'OTP sent to email.'
                    }, status=status.HTTP_200_OK)
                except Exception as e:
                    logger.error(f"Failed to send OTP email for {context} to {email}: {str(e)}")
                    raise
            except CustomUser.DoesNotExist:
                logger.error(f"User not found for OTP request: {email}")
                return Response({
                    'error': 'User not found.'
                }, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"OTP request validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        logger.info(f"Password reset request for email: {request.data.get('email')}")
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email=email)
                otp = str(random.randint(100000, 999999))
                cache.set(f'otp_{email}_forgot_password', otp, timeout=600)
                try:
                    send_mail(
                        subject='Your OTP for Password Reset',
                        message=f'Your OTP for password reset is: {otp}. It is valid for 10 minutes.',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                    )
                    logger.info(f"Password reset OTP sent to {email}")
                    return Response({
                        'message': 'Password reset OTP sent to email.'
                    }, status=status.HTTP_200_OK)
                except Exception as e:
                    logger.error(f"Failed to send password reset OTP to {email}: {str(e)}")
                    raise
            except CustomUser.DoesNotExist:
                logger.error(f"User not found for password reset: {email}")
                return Response({
                    'error': 'User not found.'
                }, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"Password reset request validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordResetView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ForgotPasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            password = serializer.validated_data['password']
            try:
                user = CustomUser.objects.get(email=email)
                cached_otp = cache.get(f'otp_{email}_forgot_password')
                if cached_otp and cached_otp == code:
                    cache.delete(f'otp_{email}_forgot_password')
                    user.set_password(password)
                    user.save()
                    logger.info(f"Password reset successful for user: {email}")
                    return Response({
                        'message': 'Password reset successful.'
                    }, status=status.HTTP_200_OK)
                logger.warning(f"Invalid or expired OTP for password reset: {email}")
                return Response({
                    'error': 'OTP is not matching or expired.'
                }, status=status.HTTP_400_BAD_REQUEST)
            except CustomUser.DoesNotExist:
                logger.error(f"User not found for password reset: {email}")
                return Response({
                    'error': 'User does not exist.'
                }, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"Password reset validation failed: {serializer.errors}")
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
        logger.error(f"Profile update failed for user {request.user.email}: {serializer.errors}")
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
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                httponly=True,
                secure=settings.DEBUG is False,
                samesite='Lax'
            )
            response.set_cookie(
                key='refresh_token',
                value=str(refresh),
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                httponly=True,
                secure=settings.DEBUG is False,
                samesite='Lax'
            )
            logger.info(f"Login successful for user: {user.email}")
            return response
        logger.error(f"Login failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            logger.warning("Refresh token not found in cookies")
            return Response({
                'detail': 'Refresh token not found in cookies'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            response = Response({
                'message': 'Token refreshed successfully'
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                key='access_token',
                value=access_token,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                httponly=True,
                secure=settings.DEBUG is False,
                samesite='Lax'
            )
            
            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
                refresh.set_jti()
                refresh.set_exp()
                new_refresh_token = str(refresh)
                
                response.set_cookie(
                    key='refresh_token',
                    value=new_refresh_token,
                    max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                    httponly=True,
                    secure=settings.DEBUG is False,
                    samesite='Lax'
                )
            
            logger.info("Token refreshed successfully")
            return response
            
        except TokenError as e:
            logger.error(f"Token refresh failed: {str(e)}")
            return Response({
                'detail': f'Token is invalid or expired: {str(e)}'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {str(e)}")
            return Response({
                'detail': 'Token refresh failed'
            }, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logger.info(f"Logout attempt for user: {request.user.email}")
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"Token blacklisted successfully for user: {request.user.email}")
        except Exception as e:
            logger.error(f"Error during logout for user {request.user.email}: {str(e)}")
        
        response = Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        
        logger.info(f"Logout successful for user: {request.user.email}")
        return response