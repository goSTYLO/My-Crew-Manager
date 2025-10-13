from django.urls import path
from .views import SignupView, LoginView, LogoutView, UserDetailView, UserListView

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("me/", UserDetailView.as_view(), name="user-detail"),
    path('all/', UserListView.as_view(), name='user_list'),
]
