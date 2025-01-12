
from api.models import Job

def get_floodmap_data(floodmap_id, status=None, v2=False):
    return get_floodmap_data_v1(floodmap_id, status) if not v2 else get_floodmap_data_v2(floodmap_id, status)

def get_floodmap_data_v1(floodmap_id, status=None):
    floodmap = {
        "name": f"Test floodmap {floodmap_id}",
        "bbox": {
            "min_lat": 37.923,
            "min_lng": 23.622,
            "max_lat": 38.019,
            "max_lng": 23.842
        },
        "flood_date": "2024-10-08T00:00:00Z",
        "days_before_flood": 30,
        "days_after_flood": 2,
    }

    product = {
        "built_at": "2024-10-16T06:30:00.307533Z",
        "geoserver_workspace": f"floodmap_{floodmap_id}",
        "esa_world_cover_layer": f"esa_world_cover_layer_{floodmap_id}",
        "s1_backscatter_layer": f"s1_backscatter_layer_{floodmap_id}",
        "t_score_layer": f"t_score_layer_{floodmap_id}",
        "flooded_regions_layer": f"flooded_regions_layer_{floodmap_id}",
        "thumbnail_url_params": f"service=WMS&version=1.1.0&request=GetMap&layers=thumbnail_layer_group_{floodmap_id}&bbox=22.2,39.55,22.3,39.65&width=768&height=768&srs=EPSG:4326&format=image/png",
        "land_cover_categories": [
                    0,
                    10,
                    20,
                    30,
                    40,
                    50,
                    60,
                    80
        ],
        "s1_backscatter_quantiles": [
            -15,
            0
        ],
        "t_score_quantiles": [
            -16,
            79
        ]
    }

    job_succeeded = {
        "status": "Succeeded",
        "stage": "Completed",
        "posted_at": "2024-10-16T06:29:52.820344Z"
    }

    job_failed = {
        "status": "Failed",
        "stage": "Pending approval",
        "error_trace": "The floodmap not was approved by administration.",
        "posted_at": "2024-10-16T06:29:52.820344Z"
    }

    job_progressing = {
        "status": "Progressing",
        "stage": "Pending approval",
        "posted_at": "2024-10-16T06:29:52.820344Z"
    }

    if status == Job.SUCCEEDED_STATUS:
        return {
            **floodmap,
            'job': job_succeeded,
            'product': product
        }
    if status == Job.FAILED_STATUS:
        return {
            **floodmap,
            'job': job_failed,
        }
    if status == Job.PROGRESSING_STATUS:
        return {
            **floodmap,
            'job': job_progressing
        }
    
    return floodmap


def get_floodmap_data_v2(floodmap_id, status=None):
    floodmap = {
        "name": f"Test floodmap {floodmap_id}",
        "bbox": {
            "min_lat": 24.761,
            "min_lng": 4.207,
            "max_lat": 24.873,
            "max_lng": 4.426
        },
        "flood_date": "2022-10-08T00:00:00Z",
        "days_before_flood": 28,
        "days_after_flood": 2,
    }

    product = {
        "built_at": "2024-10-16T06:30:00.307533Z",
        "geoserver_workspace": f"floodmap_{floodmap_id}",
        "esa_world_cover_layer": f"esa_world_cover_layer_{floodmap_id}",
        "s1_backscatter_layer": f"s1_backscatter_layer_{floodmap_id}",
        "t_score_layer": f"t_score_layer_{floodmap_id}",
        "flooded_regions_layer": f"flooded_regions_layer_{floodmap_id}",
        "thumbnail_url_params": f"service=WMS&version=1.1.0&request=GetMap&layers=thumbnail_layer_group_{floodmap_id}&bbox=22.2,39.55,22.3,39.65&width=768&height=768&srs=EPSG:4326&format=image/png",
        "land_cover_categories": [
                    0,
                    10,
                    20,
                    40,
                    60,
                    80
        ],
        "s1_backscatter_quantiles": [
            -12,
            0
        ],
        "t_score_quantiles": [
            -16,
            82
        ]
    }

    job_succeeded = {
        "status": "Succeeded",
        "stage": "Completed",
        "posted_at": "2024-10-16T06:29:52.820344Z"
    }

    job_failed = {
        "status": "Failed",
        "stage": "Pending approval",
        "error_trace": "The floodmap not was approved by administration.",
        "posted_at": "2024-10-16T06:29:52.820344Z"
    }

    job_progressing = {
        "status": "Progressing",
        "stage": "Downloading precipitation data",
        "posted_at": "2024-10-16T06:29:52.820344Z"
    }

    if status == Job.SUCCEEDED_STATUS:
        return {
            **floodmap,
            'job': job_succeeded,
            'product': product
        }
    if status == Job.FAILED_STATUS:
        return {
            **floodmap,
            'job': job_failed,
        }
    if status == Job.PROGRESSING_STATUS:
        return {
            **floodmap,
            'job': job_progressing
        }
    return floodmap
