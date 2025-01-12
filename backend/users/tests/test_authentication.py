import time
from django.test import override_settings
from rest_framework.test import APITestCase
from users.tests.helpers import create_user
from users.tests.data import user_data
from django.urls import reverse
from django.conf import settings


class TestAuthentication(APITestCase):
    """
    Most of the authentication logic is imported from djoser.
    Only custom changes are tested (configuration is not unit tested).
    """

    @classmethod
    def setUpTestData(cls):
        create_user()
        # Token iat is measured in seconds (integer) and must be after the last_password_change
        # which is set when the user is created.
        # Sleep very briefly after creating user to ensure tokens issued during the tests have
        # valid iat.
        time.sleep(1)

    def test_refresh_token_passed_in_cookie(self):
        response = self.client.post(reverse('login'), user_data())
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        self.assertIn('access', response_json)
        self.assertIn('refresh_token', response.cookies)
        refresh_cookie = response.cookies.get('refresh_token')
        self.assertTrue(refresh_cookie['httponly'])
        self.assertTrue(refresh_cookie['samesite'])
        self.assertEqual(refresh_cookie['secure'], True if settings.HTTPS_ONLY else '')

    def test_logout_deletes_refresh_token_cookie(self):
        login_response = self.client.post(reverse('login'), user_data())
        self.assertEqual(login_response.status_code, 200)
        self.assertIn('refresh_token', login_response.cookies)
        login_response_json = login_response.json()
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + login_response_json['access'])
        logout_response = self.client.post(reverse('logout'))
        self.assertEqual(logout_response.status_code, 200)
        self.assertEqual(logout_response.cookies.get('refresh_token').value, '')

    def test_refresh_requires_token_in_cookie(self):
        login_response = self.client.post(reverse('login'), user_data())
        self.assertEqual(login_response.status_code, 200)
        self.assertIn('refresh_token', login_response.cookies)
        refresh_token = login_response.cookies.get('refresh_token')
        self.assertEqual(self.client.cookies.get('refresh_token'), refresh_token)        
        refresh_response_success = self.client.post(reverse('refresh'))
        self.assertEqual(refresh_response_success.status_code, 200)
        self.assertIn('access', refresh_response_success.json())
        # remove refresh token cookie
        del self.client.cookies['refresh_token']
        refresh_response_no_token = self.client.post(reverse('refresh'))
        self.assertEqual(refresh_response_no_token.status_code, 400)
        # try posting refresh token in body
        refresh_response_token_in_body = self.client.post(reverse('refresh'), { 'refresh_token', refresh_token.value })
        self.assertEqual(refresh_response_token_in_body.status_code, 400)

    @override_settings(DJOSER={**settings.DJOSER, 'PASSWORD_CHANGED_EMAIL_CONFIRMATION': False})
    def test_password_change_invalidates_tokens(self):
        login_response = self.client.post(reverse('login'), user_data())
        self.assertEqual(login_response.status_code, 200)
        current_password = user_data().get('password')
        new_password = "Ws1dsd1ghnb"
        set_password_data = {
            "new_password": new_password,
            "re_new_password": new_password,
            "current_password": current_password
        }
        access_token = login_response.json().get('access')
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + access_token)
        set_password_response = self.client.post(reverse('set-password'), set_password_data)
        self.assertEqual(set_password_response.status_code, 204)
        # Attempt to use the access token acquired prior to the password change to log out.
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + access_token)
        logout_response = self.client.post(reverse('logout'))
        logout_response_json = logout_response.json()
        self.assertEqual(logout_response.status_code, 401)
        self.assertEqual(logout_response_json['detail'], 'Token was issued before the last password change')
        # Attempt to use the refresh token acquired prior to the password change to get a new access token.
        self.assertIn('refresh_token', login_response.cookies)
        refresh_response = self.client.post(reverse('refresh'))
        self.assertEqual(refresh_response.status_code, 200)  # New access token is received, but it is expired!
        new_access_token = refresh_response.json().get('access')
        self.client.credentials(HTTP_AUTHORIZATION='JWT ' + new_access_token)
        logout_response = self.client.post(reverse('logout'))
        logout_response_json = logout_response.json()
        self.assertEqual(logout_response.status_code, 401)
        self.assertEqual(logout_response_json['detail'], 'Token was issued before the last password change')
