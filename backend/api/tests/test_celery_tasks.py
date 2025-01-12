from rest_framework.test import APITestCase
from unittest import mock
from channels.testing import WebsocketCommunicator
from api.models import Job
from asgiref.sync import async_to_sync
from api.routing import channels_app
from api.tests.data import get_floodmap_data
from api.tests.helpers import create_floodmap
from api.celery_worker.tasks import run_floodpy, delete_floodmap_products


class TestCeleryTasks(APITestCase):
    """
    Validate the functions that are executed by the celery worker.
    """

    @mock.patch('api.celery_worker.tasks.GeoserverManager.delete_workspace_recursively')
    @mock.patch('api.celery_worker.tasks.delete_file')
    @mock.patch('os.rmdir')
    def test_delete_floodmap_products_succeeded(self, mock_delete_directory, mock_delete_file, mock_delete_workspace_recursively):
        id_succeeded = 1  # used to get the names of the product assets to delete
        delete_floodmap_products(id_succeeded, Job.SUCCEEDED_STATUS)
        # Deletes geoserver workspace
        mock_delete_workspace_recursively.assert_called_once()
        # Deletes the product assets
        self.assertEqual(mock_delete_file.call_count, 5)
        mock_delete_directory.assert_called_once()


    @mock.patch('api.celery_worker.tasks.GeoserverManager.delete_workspace_recursively')
    @mock.patch('api.celery_worker.tasks.delete_file')
    @mock.patch('os.rmdir')
    def test_delete_floodmap_products_failed(self, mock_delete_directory, mock_delete_file, mock_delete_workspace_recursively):
        id_failed = 2
        delete_floodmap_products(id_failed, Job.FAILED_STATUS)
        # Failed jobs do not have geoserver workspace
        mock_delete_workspace_recursively.assert_not_called()
        self.assertEqual(mock_delete_file.call_count, 5)
        mock_delete_directory.assert_called_once()


    @mock.patch('api.celery_worker.tasks.send_job_update_notification')
    @mock.patch('api.celery_worker.tasks.FloodpyMock')
    def test_run_floodpy_success(self, mock_floodpy_mock, mock_send_job_update_notification):
        id_progressing = 3
        create_floodmap(id_progressing, Job.PROGRESSING_STATUS)
        # Setup mock methods to return True, i.e., successful completion of floodpy stages.
        mock_floodpy_instance = mock_floodpy_mock.return_value
        mock_floodpy_instance.download_precipitation_data.return_value = True
        mock_floodpy_instance.download_sentinel_1_images.return_value = True
        mock_floodpy_instance.preprocess_sentinel_1_images.return_value = True
        mock_floodpy_instance.performing_statistical_analysis.return_value = True
        mock_floodpy_instance.classify_floodwater.return_value = True
        mock_floodpy_instance.commit_results.return_value = True
        mock_floodpy_instance.product_data = {
            'floodmap': id_progressing,
            **get_floodmap_data(id_progressing, Job.SUCCEEDED_STATUS)['product']
        }
        # Execute driver function of floodpy task.
        run_floodpy(id_progressing)
        # Verify the mock methods and DB content.
        mock_floodpy_instance.download_precipitation_data.assert_called_once()
        mock_floodpy_instance.download_sentinel_1_images.assert_called_once()
        mock_floodpy_instance.preprocess_sentinel_1_images.assert_called_once()
        mock_floodpy_instance.performing_statistical_analysis.assert_called_once()
        mock_floodpy_instance.classify_floodwater.assert_called_once()
        mock_floodpy_instance.commit_results.assert_called_once()
        self.assertEqual(mock_send_job_update_notification.call_count, 7)  # 1st update is sent from the view
        job = Job.objects.get(pk=id_progressing)
        self.assertEqual(job.stage, Job.STAGE_8)
        self.assertEqual(job.status, Job.SUCCEEDED_STATUS)

    @mock.patch('api.celery_worker.tasks.send_job_update_notification')
    @mock.patch('api.celery_worker.tasks.FloodpyMock')
    def test_run_floodpy_error(self, mock_floodpy_mock, mock_send_job_update_notification):
        id_progressing = 3
        expected_error_trace = 'Error when preprocessing sentinel 1 images'
        create_floodmap(id_progressing, Job.PROGRESSING_STATUS)
        mock_floodpy_instance = mock_floodpy_mock.return_value
        mock_floodpy_instance.download_precipitation_data.return_value = True
        mock_floodpy_instance.download_sentinel_1_images.return_value = True
        mock_floodpy_instance.preprocess_sentinel_1_images.return_value = False  # floodpy fails
        mock_floodpy_instance.error_trace = expected_error_trace
        mock_floodpy_instance.performing_statistical_analysis.return_value = True
        mock_floodpy_instance.classify_floodwater.return_value = True
        mock_floodpy_instance.commit_results.return_value = True
        # Execute driver function of floodpy task.
        run_floodpy(id_progressing)
        # Verify the mock methods and DB content.
        mock_floodpy_instance.download_precipitation_data.assert_called_once()
        mock_floodpy_instance.download_sentinel_1_images.assert_called_once()
        mock_floodpy_instance.preprocess_sentinel_1_images.assert_called_once()
        mock_floodpy_instance.performing_statistical_analysis.assert_not_called()
        mock_floodpy_instance.classify_floodwater.assert_not_called()
        mock_floodpy_instance.commit_results.assert_not_called()
        self.assertEqual(mock_send_job_update_notification.call_count, 4)
        job = Job.objects.get(pk=id_progressing)
        self.assertEqual(job.stage, Job.STAGE_4)
        self.assertEqual(job.status, Job.FAILED_STATUS)
        self.assertEqual(job.error_trace, expected_error_trace)
