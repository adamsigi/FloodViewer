from rest_framework.test import APITestCase
from unittest import mock
from django.urls import reverse
from django.contrib.auth import get_user_model
from api.models import Job, Floodmap
from users.tests.data import user_data, staff_user_data
from api.tests.helpers import create_floodmap
from users.tests.helpers import create_user, create_staff_user

User = get_user_model()

class TestDetailJobs(APITestCase):
    """
    Add floodmaps to the DB and assert that GET and PATCH requests on the detail jobs endpoint
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

    def test_get_succeeded_job(self):
        id_succeeded = 1  # Id is based on creation order
        response = self.client.get(reverse('detail-jobs', args=[id_succeeded]))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        self.assertEqual(response_json['status'], Job.SUCCEEDED_STATUS)
        self.assertEqual(response_json['stage'], Job.STAGE_8)
        self.assertEqual(id_succeeded, response_json['floodmap'])

    def test_get_failed_job(self):
        id_failed = 2
        response = self.client.get(reverse('detail-jobs', args=[id_failed]))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        self.assertEqual(response_json['status'], Job.FAILED_STATUS)
        self.assertEqual(id_failed, response_json['floodmap'])

    def test_get_progressing_job(self):
        id_progressing = 3
        response = self.client.get(reverse('detail-jobs', args=[id_progressing]))
        self.assertEqual(response.status_code, 200)
        response_json = response.json()
        self.assertEqual(response_json['status'], Job.PROGRESSING_STATUS)
        self.assertEqual(id_progressing, response_json['floodmap'])
    
    def test_get_with_invalid_id(self):
        id_invalid = 1234
        response = self.client.get(reverse('detail-jobs', args=[id_invalid]))
        self.assertEqual(response.status_code, 404)
        response_json = response.json()
        self.assertEqual('Job not found', response_json['error'])

    @mock.patch('api.views.run_floodpy.delay_on_commit')
    def test_patch_attempt(self, mock_run_floodpy):
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.FAILED_STATUS)
        approval_data = { "approve": True }
        response = self.client.patch(reverse('detail-jobs', args=[id]), approval_data)
        self.assertEqual(response.status_code, 401)  # Unauthorized (must be staff)
        mock_run_floodpy.assert_not_called()
    
    @mock.patch('api.views.run_floodpy.delay_on_commit')
    def test_patch_attempt_auth(self, mock_run_floodpy):
        user = User.objects.get(email=user_data()['email'])
        self.client.force_authenticate(user=user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.FAILED_STATUS, user=user)
        approval_data = { "approve": True }
        response = self.client.patch(reverse('detail-jobs', args=[id]), approval_data)
        self.assertEqual(response.status_code, 403)  # Forbidden (must be staff not just regular user)
        mock_run_floodpy.assert_not_called()

    @mock.patch('api.views.run_floodpy.delay_on_commit')
    def test_patch_attempt_non_pending_approval_auth_staff(self, mock_run_floodpy):
        staff_user = User.objects.get(email=staff_user_data()['email'])
        self.client.force_authenticate(user=staff_user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.SUCCEEDED_STATUS)
        # job is successful, thus not in the "Pending approval" (STAGE_0) stage
        # so it cannot be patched/(dis)approved
        approval_data = { "approve": True }
        response = self.client.patch(reverse('detail-jobs', args=[id]), approval_data)
        self.assertEqual(response.status_code, 400)
        mock_run_floodpy.assert_not_called()
    
    @mock.patch('api.views.run_floodpy.delay_on_commit')
    def test_patch_attempt_invalid_data_auth_staff(self, mock_run_floodpy):
        staff_user = User.objects.get(email=staff_user_data()['email'])
        self.client.force_authenticate(user=staff_user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.SUCCEEDED_STATUS)
        approval_data = { "foo": 'bar' }
        response = self.client.patch(reverse('detail-jobs', args=[id]), approval_data)
        self.assertEqual(response.status_code, 400)
        mock_run_floodpy.assert_not_called()

    @mock.patch('api.views.run_floodpy.delay_on_commit')
    @mock.patch('api.views.send_job_update_notification')
    def test_patch_approve_auth_staff(self, mock_send_job_update_notification, mock_run_floodpy):
        staff_user = User.objects.get(email=staff_user_data()['email'])
        self.client.force_authenticate(user=staff_user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.FAILED_STATUS)
        job = Job.objects.get(pk=id)
        self.assertEqual(job.stage, Job.STAGE_0)
        approval_data = { "approve": True }
        response = self.client.patch(reverse('detail-jobs', args=[id]), approval_data)
        self.assertEqual(response.status_code, 200)
        # Validate response
        response_json = response.json()
        self.assertEqual(response_json['stage'], Job.STAGE_1)
        self.assertEqual(response_json['status'], Job.PROGRESSING_STATUS)
        self.assertIsNone(response_json.get('error_trace'))
        # Validate DB contents
        job.refresh_from_db()
        self.assertEqual(job.stage, Job.STAGE_1)
        self.assertEqual(job.status, Job.PROGRESSING_STATUS)
        self.assertEqual(job.error_trace, '')
        mock_run_floodpy.assert_called_once()
        mock_send_job_update_notification.assert_called_once()

    @mock.patch('api.views.run_floodpy.delay_on_commit')
    @mock.patch('api.views.send_job_update_notification')
    def test_patch_disapprove_auth_staff(self, mock_send_job_update_notification, mock_run_floodpy):
        staff_user = User.objects.get(email=staff_user_data()['email'])
        self.client.force_authenticate(user=staff_user)
        id = self.last_floodmap_id + 1
        create_floodmap(id, Job.PROGRESSING_STATUS)
        job = Job.objects.get(pk=id)
        self.assertEqual(job.stage, Job.STAGE_0)
        approval_data = { "approve": False }
        response = self.client.patch(reverse('detail-jobs', args=[id]), approval_data)
        self.assertEqual(response.status_code, 200)
        job.refresh_from_db()
        self.assertEqual(job.stage, Job.STAGE_0)
        self.assertEqual(job.status, Job.FAILED_STATUS)
        self.assertEqual(job.error_trace, 'The floodmap not was approved by administration.')
        mock_run_floodpy.assert_not_called()
        mock_send_job_update_notification.assert_called_once()
