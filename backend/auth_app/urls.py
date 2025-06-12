from django.urls import path

from auth_app import views
urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/verify-otp/',views.OtpVerifyView.as_view(), name='verify-otp')
        
]
