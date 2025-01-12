from rest_framework.test import APITestCase
from unittest import mock
from django.urls import reverse
from django.contrib.auth import get_user_model
from api.models import Job
from api.tests.data import get_floodmap_data
from users.tests.data import user_data, staff_user_data
from users.tests.helpers import create_user, create_staff_user
from api.tests.helpers import create_floodmap


User = get_user_model()


class TestDetailFloodmaps(APITestCase):
    """
    Add floodmaps to the DB and assert that GET and DELETE requests on the detail floodmaps endpoint
    have the expected results.
    """

    @classmethod
    def setUpTestData(cls):
        create_floodmap(1, Job.SUCCEEDED_STATUS)
        create_floodmap(2, Job.FAILED_STATUS)
        create_floodmap(3, Job.PROGRESSING_STATUS)
        cls.last_floodmap_id = 3
        create_user()
        create_staff_user()

    def test_get_succeeded_floodmap(self):
        id_succeeded = 1
        response = self.client.get(reverse('detail-floodmaps', args=[id_succeeded]))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        # Assert data used to create floodmap are properly returned.
        self.assertDictEqual(response_json, {'id': id_succeeded, **get_floodmap_data(id_succeeded, Job.SUCCEEDED_STATUS)})

    def test_get_failed_floodmap(self):
        id_failed = 2
        response = self.client.get(reverse('detail-floodmaps', args=[id_failed]))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        self.assertDictEqual(response_json, {'id': id_failed, **get_floodmap_data(id_failed, Job.FAILED_STATUS)})

    def test_get_progressing_floodmap(self):
        id_progressing = 3
        response = self.client.get(reverse('detail-floodmaps', args=[id_progressing]))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        self.assertDictEqual(response_json, {'id': id_progressing, **get_floodmap_data(id_progressing, Job.PROGRESSING_STATUS)})

    def test_get_attempt_with_invalid_id(self):
        id_invalid = 1234
        response = self.client.get(reverse('detail-floodmaps', args=[id_invalid]))
        self.assertEqual(response.status_code, 404)
        response_json = response.json()
        self.assertEqual('Floodmap not found', response_json['error'])

    @mock.patch('api.views.delete_floodmap_products')
    def test_delete_attempt(self, mock_delete_floodmap_products):
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.SUCCEEDED_STATUS)
        response = self.client.delete(reverse('detail-floodmaps', args=[id]))
        self.assertEqual(response.status_code, 401)  # Unauthorized (must be logged in and staff)
        mock_delete_floodmap_products.assert_not_called()
    
    @mock.patch('api.views.delete_floodmap_products')
    def test_delete_attempt_auth(self, mock_delete_floodmap_products):
        user = User.objects.get(email=user_data()['email'])
        self.client.force_authenticate(user=user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.SUCCEEDED_STATUS, user=user)
        response = self.client.delete(reverse('detail-floodmaps', args=[id]))
        self.assertEqual(response.status_code, 403)  # Forbidden (must be logged in AND staff)
        mock_delete_floodmap_products.assert_not_called()

    @mock.patch('api.views.delete_floodmap_products')
    def test_delete_succeeded_floodmap_auth_staff(self, mock_delete_floodmap_products):
        staff_user = User.objects.get(email=staff_user_data()['email'])
        self.client.force_authenticate(user=staff_user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.SUCCEEDED_STATUS)
        response = self.client.delete(reverse('detail-floodmaps', args=[id]))
        self.assertEqual(response.status_code, 204)
        mock_delete_floodmap_products.assert_called_once_with(id, Job.SUCCEEDED_STATUS)
    
    @mock.patch('api.views.delete_floodmap_products')
    def test_delete_attempt_progressing_floodmap_auth_staff(self, mock_delete_floodmap_products):
        staff_user = User.objects.get(email=staff_user_data()['email'])
        self.client.force_authenticate(user=staff_user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.PROGRESSING_STATUS)
        response = self.client.delete(reverse('detail-floodmaps', args=[id]))
        self.assertEqual(response.status_code, 400)  # Cannot delete floodmaps in progress
        mock_delete_floodmap_products.assert_not_called()
