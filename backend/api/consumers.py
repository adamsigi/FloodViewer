import json
import logging
from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync
from api.models import Job

logger = logging.getLogger(__name__)


class UpdatesConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.accept()
        self.floodmap_id = self.scope['url_route']['kwargs']['floodmapId']
        job = Job.objects.filter(pk=self.floodmap_id).first()
        if not job:
            message = {"error": "Job not found"}
            self.send_json(message)
            self.close()
        
        # First subscribe to receive job updates (i.e. add channel to group with floodmap id).
        # Must be done before checking the job status!!
        # If status is checked first it is possible to miss updates in the time between the status
        # check and the subscription to updates!
        self.updates_group_name = f'floodmap_{self.floodmap_id}'
        async_to_sync(self.channel_layer.group_add)(
            self.updates_group_name, self.channel_name
        )

        if job.status == Job.SUCCEEDED_STATUS:
            message = {"status": job.status, "stage": job.stage,}
            self.send_json(message)
            self._cleanup()
        elif job.status == Job.FAILED_STATUS:
            message = {
                "status": job.status,
                "stage": job.stage,
                "error_trace": job.error_trace
            }
            self.send_json(message)
            self._cleanup()
        else:
            message = {
                "status": job.status,
                "stage": job.stage,
            }
            self.send_json(message)
            # will send more job updates as they arrive from celery task


    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.updates_group_name, self.channel_name
        )

    def receive(self, text_data):
        # Could be used in the future to add interactivity.
        pass

    def job_update(self, event):
        message = event.get("message")
        if message == None or message.get("status") == None:
            logger.error('Received invalid job update. Nothing will be sent!')
            return
        logger.info(message)
        self.send_json(message)
        if message["status"] in [Job.FAILED_STATUS, Job.SUCCEEDED_STATUS]:
            self._cleanup()

    def _cleanup(self):
        async_to_sync(self.channel_layer.group_discard)(
                self.updates_group_name, self.channel_name
            )
        self.close()