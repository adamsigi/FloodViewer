import os
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


def send_job_update_notification(job):
    message = {
        'status': job.status,
        'stage': job.stage,
    }
    if job.error_trace:
        message['error_trace'] = job.error_trace

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'floodmap_{job.floodmap.id}',
        {
            'type': 'job_update',
            'message': message
        }
    )


def delete_file(filepath):
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            logger.debug(f"File {filepath} has been deleted.")
            return True
        else:
            logger.debug(f"File {filepath} not found.")
            return False
    except Exception as e:
        logger.error(f"Failed to delete file {filepath} due to error: {e}")
        return False


def truncate_string(input_string, max_length=200):
    if len(input_string) > max_length:
        return input_string[:max_length]
    return input_string
