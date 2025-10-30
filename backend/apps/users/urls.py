#urls.py
from django.urls import path
from .views import SignupView, LoginView, LogoutView, UserDetailView, UserListView, PasswordResetView
from .views import EmailRequestView, EmailVerifyView
from .views import AccountDeleteView

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
]
