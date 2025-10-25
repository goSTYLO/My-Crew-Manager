#urls.py
from django.urls import path
from .views import SignupView, LoginView, LogoutView, UserDetailView, UserListView, PasswordResetView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("me/", UserDetailView.as_view(), name="user-detail"),
    path('', UserListView.as_view(), name='user_list'),
    path('reset-password/', PasswordResetView.as_view(), name='reset-password'),
]
