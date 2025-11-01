#urls.py
from django.urls import path
from .views import SignupView, LoginView, LogoutView, UserDetailView, UserListView, PasswordResetView
from .views import EmailRequestView, EmailVerifyView
from .views import AccountDeleteView
from .views import (
    Enable2FAView, Verify2FASetupView, Disable2FAView,
    Get2FAStatusView, Verify2FALoginView
)

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("me/", UserDetailView.as_view(), name="user-detail"),
    path('', UserListView.as_view(), name='user_list'),
    path('reset-password/', PasswordResetView.as_view(), name='reset-password'),
    path('email/request/', EmailRequestView.as_view(), name='email-request'),
    path('email/verify/', EmailVerifyView.as_view(), name='email-verify'),
    path('delete/', AccountDeleteView.as_view(), name='account-delete'),
    path('2fa/enable/', Enable2FAView.as_view(), name='2fa-enable'),
    path('2fa/verify-setup/', Verify2FASetupView.as_view(), name='2fa-verify-setup'),
    path('2fa/disable/', Disable2FAView.as_view(), name='2fa-disable'),
    path('2fa/status/', Get2FAStatusView.as_view(), name='2fa-status'),
    path('2fa/verify-login/', Verify2FALoginView.as_view(), name='2fa-verify-login'),
]
