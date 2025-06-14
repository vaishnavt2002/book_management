# auth_app/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model

User = get_user_model()

class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from cookies
    """
    def authenticate(self, request):
        # First try the default header-based authentication
        header_auth = super().authenticate(request)
        if header_auth:
            return header_auth
        
        # If header auth fails, try cookie-based authentication
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return None
        
        try:
            # Validate the token
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except TokenError:
            return None