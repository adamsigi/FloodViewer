from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from djoser.views import UserViewSet
from django.conf import settings
from rest_framework.permissions import IsAuthenticated


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'auth'

    def post(self, request):
        response = Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_NAME'])
        return response


class LoginView(TokenObtainPairView):
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        # Send the refresh token in HTTP Only cookie instead of in the body or the response.
        response = super().post(request, *args, **kwargs)
        refresh_token = response.data.get('refresh')
        del response.data['refresh']

        if refresh_token:
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_NAME'],
                value=refresh_token,
                max_age=int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
                secure=settings.HTTPS_ONLY,
                httponly=True,
                samesite='Strict',
            )
        return response


class RefreshView(TokenRefreshView):
    throttle_scope = 'auth'

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_NAME'])

        if refresh_token:
            request.data['refresh'] = refresh_token
        else:
            return Response({'error': 'Refresh token not found in cookies'}, status=400)

        return super().post(request, *args, **kwargs)


class ThrottledUserViewSet(UserViewSet):
    throttle_scope = 'auth'
