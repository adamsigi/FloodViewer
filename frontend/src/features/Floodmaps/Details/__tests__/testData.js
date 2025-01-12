export const failedJob = {
    "id": 1,
    "name": "Test Flood",
    "bbox": {
        "min_lat": 37.923,
        "min_lng": 23.622,
        "max_lat": 38.019,
        "max_lng": 23.842
    },
    "flood_date": "2024-10-08T00:00:00Z",
    "days_before_flood": 30,
    "days_after_flood": 2,
    "job": {
        "status": "Failed",
        "stage": "Committing results",
        "error_trace": "Testing something went wrong",
        "posted_at": "2024-10-20T10:33:41Z"
    },
}

export const progressingJob = {
    "id": 2,
    "name": "Test Flood",
    "bbox": {
        "min_lat": 37.923,
        "min_lng": 23.622,
        "max_lat": 38.019,
        "max_lng": 23.842
    },
    "flood_date": "2024-10-08T00:00:00Z",
    "days_before_flood": 30,
    "days_after_flood": 2,
    "job": {
        "status": "Progressing",
        "stage": "Pending approval",
        "posted_at": "2024-10-20T10:33:41Z"
    },
}

export const succeededJob = {
    "id": 2,
    "name": "Test Flood",
    "bbox": {
        "min_lat": 37.923,
        "min_lng": 23.622,
        "max_lat": 38.019,
        "max_lng": 23.842
    },
    "flood_date": "2024-10-24T00:00:00Z",
    "days_before_flood": 30,
    "days_after_flood": 2,
    "job": {
        "status": "Succeeded",
        "stage": "Completed",
        "posted_at": "2024-10-26T12:35:08.386875Z"
    },
    "product": {
        "built_at": "2024-10-26T15:35:47.132179Z",
        "geoserver_workspace": "floodmap_52",
        "esa_world_cover_layer": "esa_world_cover_layer_52",
        "s1_backscatter_layer": "s1_backscatter_layer_52",
        "t_score_layer": "t_score_layer_52",
        "flooded_regions_layer": "flooded_regions_layer_52",
        "thumbnail_url_params": "service=WMS&version=1.1.0&request=GetMap&layers=thumbnail_layer_group_52&bbox=22.2,39.55,22.3,39.65&width=568&height=568&srs=EPSG:4326&format=image/png",
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
    },
}
