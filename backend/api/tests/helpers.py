from api.models import Floodmap, Job, Product
from api.tests.data import get_floodmap_data

def create_floodmap(floodmap_id, job_status, user=None, v2=False):
    data = get_floodmap_data(floodmap_id, job_status, v2)

    floodmap = Floodmap.objects.create(
        id=floodmap_id,
        name=data['name'],
        owner=user,
        min_lat=data['bbox']['min_lat'],
        min_lng=data['bbox']['min_lng'],
        max_lat=data['bbox']['max_lat'],
        max_lng=data['bbox']['max_lng'],
        flood_date=data['flood_date'],
        days_before_flood=data['days_before_flood'],
        days_after_flood=data['days_after_flood']
    )

    Job.objects.create(
        floodmap=floodmap,
        **data['job']
    )

    if job_status == Job.SUCCEEDED_STATUS:
        Product.objects.create(
            floodmap=floodmap,
            **data['product']
        )
