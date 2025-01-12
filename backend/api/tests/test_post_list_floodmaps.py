from rest_framework.test import APITestCase
from unittest import mock
from django.urls import reverse
from django.contrib.auth import get_user_model
from datetime import datetime
from api.models import Job, Floodmap
from api.tests.data import get_floodmap_data
from users.tests.data import user_data, staff_user_data
from users.tests.helpers import create_user, create_staff_user

User = get_user_model()

class TestPostListFloodmaps(APITestCase):
    """
    Create floodmap as guest, regular user, and staff user.
    """

    @classmethod
    def setUpTestData(cls):
        create_user()
        create_staff_user()

    def test_invalid_data(self):
        invalid_floodmap_data = { 'foo': 'bar' }
        response = self.client.post(reverse('list-floodmaps'), invalid_floodmap_data)
        self.assertEqual(response.status_code, 400)
    
    def test_invalid_data_missing_lng(self):
        invalid_floodmap_data = get_floodmap_data(1)
        del invalid_floodmap_data['bbox']['min_lng']
        response = self.client.post(reverse('list-floodmaps'), invalid_floodmap_data)
        self.assertEqual(response.status_code, 400)
    
    def test_invalid_data_min_lng_greater_than_max_lng(self):
        invalid_floodmap_data = get_floodmap_data(1)
        invalid_floodmap_data['bbox']['min_lng'] = invalid_floodmap_data['bbox']['max_lng'] + 1
        response = self.client.post(reverse('list-floodmaps'), invalid_floodmap_data)
        self.assertEqual(response.status_code, 400)
    
    def test_invalid_data_flood_date_in_the_future(self):
        invalid_floodmap_data = get_floodmap_data(1)
        invalid_floodmap_data['flood_date'] = "3024-10-08T00:00:00Z"
        response = self.client.post(reverse('list-floodmaps'), invalid_floodmap_data)
        self.assertEqual(response.status_code, 400)

    @mock.patch('api.views.run_floodpy.delay_on_commit')
    def test_new_floodmap(self, mock_run_floodpy):
        floodmap_data = get_floodmap_data(1)
        response = self.client.post(reverse('list-floodmaps'), floodmap_data)
        self.assertEqual(response.status_code, 201)
        response_json = response.json()
        self.assertEqual(response_json['job']['status'], Job.PROGRESSING_STATUS)
        self.assertEqual(response_json['job']['stage'], Job.STAGE_0)
        # Verify floodmap is in DB
        floodmap = Floodmap.objects.filter(pk=response_json['id']).first()
        self.assertIsNotNone(floodmap)
        # Verify response content
        del response_json['job']
        del response_json['id']
        self.assertDictEqual(response_json, floodmap_data)
        mock_run_floodpy.assert_not_called()  # requires staff approval
    
    @mock.patch('api.views.run_floodpy.delay_on_commit')
    def test_floodmap_data_with_id_and_user(self, mock_run_floodpy):
        posted_id = 12345
        posted_user = User.objects.get(email=user_data()['email'])
        floodmap_data = get_floodmap_data(1)
        floodmap_data['id'] = posted_id
        floodmap_data['owner'] = posted_user.email
        response = self.client.post(reverse('list-floodmaps'), floodmap_data)
        response_json = response.json()
        self.assertEqual(response.status_code, 201)
        response_json = response.json()
        # Posted id and owner are not considered (cannot be set by user).
        floodmap = Floodmap.objects.filter(pk=response_json['id']).first()
        # The id depends on the creation order
        self.assertNotEqual(floodmap.id, posted_id)
        # The owner depends on the logged in user.
        self.assertNotEqual(floodmap.owner, posted_id)
        mock_run_floodpy.assert_not_called()
    
    @mock.patch('api.views.run_floodpy.delay_on_commit')
    def test_new_floodmap_auth(self, mock_run_floodpy):
        user = User.objects.get(email=user_data()['email'])
        self.client.force_authenticate(user=user)
        floodmap_data = get_floodmap_data(1)
        response = self.client.post(reverse('list-floodmaps'), floodmap_data)
        self.assertEqual(response.status_code, 201)
        response_json = response.json()
        self.assertEqual(response_json['job']['status'], Job.PROGRESSING_STATUS)
        self.assertEqual(response_json['job']['stage'], Job.STAGE_0)
        # Verify floodmap owner is the logged in user.
        floodmap = Floodmap.objects.filter(pk=response_json['id']).first()
        self.assertEqual(floodmap.owner, user)
        # Verify response content
        del response_json['job']
        del response_json['id']
        self.assertDictEqual(response_json, floodmap_data)
        mock_run_floodpy.assert_not_called()  # user is not staff
    
    @mock.patch('api.views.run_floodpy.delay_on_commit')
    @mock.patch('api.views.send_job_update_notification')
    def test_new_floodmap_auth_staff(self, mock_send_job_update_notification, mock_run_floodpy):
        staff_user = User.objects.get(email=staff_user_data()['email'])
        self.client.force_authenticate(user=staff_user)
        floodmap_data = get_floodmap_data(1)
        response = self.client.post(reverse('list-floodmaps'), floodmap_data)
        self.assertEqual(response.status_code, 201)
        response_json = response.json()
        self.assertEqual(response_json['job']['status'], Job.PROGRESSING_STATUS)
        self.assertEqual(response_json['job']['stage'], Job.STAGE_1)
        # Verify floodmap owner is the logged in user.
        floodmap = Floodmap.objects.filter(pk=response_json['id']).first()
        self.assertEqual(floodmap.owner, staff_user)
        self.assertTrue(response_json['owned'])
        self.assertEqual(response_json['job']['stage'], Job.STAGE_1)  # Has been approved
        mock_run_floodpy.assert_called_once()
        mock_send_job_update_notification.assert_called_once()
