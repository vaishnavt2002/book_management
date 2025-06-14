from django.urls import path

from auth_app.views import *
urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/otp/request/', OtpRequestView.as_view(), name='otp_request'),
    path('auth/otp/verify/', OtpVerifyView.as_view(), name='otp_verify'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
]
