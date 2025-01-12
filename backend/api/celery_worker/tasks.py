import os
import logging
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from floodviewer.settings import DEBUG, GHOST_MODE, PRODUCTS_PATH, CELERY_TASK_TIME_LIMIT
from api.utils import send_job_update_notification, delete_file, truncate_string
from api.models import Job, Floodmap
from api.serializers import FloodmapSerializer, ProductSerializer
from api.celery_worker.geoserver_manager import GeoserverManager
from api.celery_worker.names import Names
from api.celery_worker.floodpy_mock import FloodpyMock
from api.celery_worker.floodpy import Floodpy

logger = logging.getLogger(__name__)

@shared_task(bind=True, ignore_result=True, soft_time_limit=CELERY_TASK_TIME_LIMIT - 10)
def run_floodpy(self, floodmap_id):
    try:
        floodmap = Floodmap.objects.get(pk=floodmap_id)
        job = Job.objects.get(pk=floodmap_id)
        floodmap_data = FloodmapSerializer(floodmap).data
        floodpy = FloodpyMock(floodmap_data) if DEBUG and GHOST_MODE else Floodpy(floodmap_data)
        floodpy_and_job_stages = [
            (floodpy.download_precipitation_data, Job.STAGE_2),
            (floodpy.download_sentinel_1_images, Job.STAGE_3),
            (floodpy.preprocess_sentinel_1_images, Job.STAGE_4),
            (floodpy.performing_statistical_analysis, Job.STAGE_5),
            (floodpy.classify_floodwater, Job.STAGE_6),
            (floodpy.commit_results, Job.STAGE_7),
        ]
        for (floodpy_stage, job_stage) in floodpy_and_job_stages:
            job.stage = job_stage  # Update client and DB before starting the next stage.
            job.save()
            send_job_update_notification(job)
            res = floodpy_stage()  # Execute the next floodpy stage.
            if not res:
                job.status = Job.FAILED_STATUS  # When floodpy fails update client and DB.
                job.error_trace = truncate_string(floodpy.error_trace)
                job.save()
                send_job_update_notification(job)
                return
        
        # On success save floodpy products and update client and DB.
        product_serializer = ProductSerializer(data=floodpy.product_data)
        if product_serializer.is_valid():
            product_serializer.save()
            job.stage = Job.STAGE_8
            job.status = Job.SUCCEEDED_STATUS
        else:
            job.status = Job.FAILED_STATUS
            job.error_trace = truncate_string(f'Failed to serialize product data returned from floodpy: {floodpy.product_data}')

        job.save()
        send_job_update_notification(job)

    except (Floodmap.DoesNotExist, Job.DoesNotExist):
        logger.error(f'Failed to run floodpy: no Floodmap found with id: {floodmap_id}')
    except Exception as exc:
        logger.error(exc)
        job = Job.objects.get(pk=floodmap_id)
        job.status = Job.FAILED_STATUS
        if isinstance(exc, SoftTimeLimitExceeded):
            job.error_trace = 'Task time limit exceeded!'
        else:
            job.error_trace = truncate_string(str(exc))
        job.save()
        send_job_update_notification(job)
        

@shared_task(bind=True, ignore_result=True)
def delete_floodmap_products(self, floodmap_id, job_status):
    names = Names(floodmap_id)
    if job_status == Job.SUCCEEDED_STATUS:
        geoserver_manager = GeoserverManager()
        geoserver_manager.delete_workspace_recursively(names.workspace())

    product_files = [
        names.esa_world_cover()[1],
        names.s1_backscatter()[1],
        names.t_score()[1],
        names.flooded_regions()[1],
        names.thumbnail()[1],
    ]
    for product_file in product_files:
        delete_file(os.path.join(PRODUCTS_PATH, names.data_directory(), product_file))

    os.rmdir(PRODUCTS_PATH, names.data_directory())
