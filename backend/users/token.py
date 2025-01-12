
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings
from django.contrib.auth import get_user_model

from rest_framework_simplejwt.tokens import AccessToken

class EnhancedAccessToken(AccessToken):
    def verify(self):
        super().verify()
        user_id = self.get(api_settings.USER_ID_CLAIM)
        user = get_user_model().objects.filter(pk=user_id).first()
        if not user:
            raise AuthenticationFailed("Token is not associated with an active account")
        
        last_password_change = user.last_password_change
        iat = self.get('iat')

        if iat < last_password_change.timestamp():
            raise AuthenticationFailed('Token was issued before the last password change')
