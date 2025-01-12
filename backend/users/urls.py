from django.urls import path, include
from .views import LogoutView, LoginView, RefreshView, ThrottledUserViewSet

urlpatterns = [
    # Log in with user email and password (new JWT)
    path('users/login/', LoginView.as_view(), name='login'),

    # Log out
    path('users/logout/', LogoutView.as_view(), name='logout'),

    # Get new JWT
    path('users/refresh/', RefreshView.as_view(), name='refresh'),

    # Register new user (via activation email) and delete existing user
    path('users/',
         ThrottledUserViewSet.as_view({'post': 'create', 'delete': 'me'}), name='users'),

    # Activate new user by providing validation token and uid contained in email
    path('users/activation/',
         ThrottledUserViewSet.as_view({'post': 'activation'}), name='activate-user'),

    # Set user password by providing existing password
    path('users/set_password/',
         ThrottledUserViewSet.as_view({'post': 'set_password'}), name='set-password'),

    # Request password reset via email
    path('users/reset_password/',
         ThrottledUserViewSet.as_view({'post': 'reset_password'}), name='reset-password'),

    # Reset password by providing validation token and uid contained in email
    path('users/reset_password_confirm/',
         ThrottledUserViewSet.as_view({'post': 'reset_password_confirm'}), name='reset-password-confirm'),
]
