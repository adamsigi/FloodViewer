from django.conf import settings
from django.db import models
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField

# Parameters identifying the flood map.
class Floodmap(models.Model):
    name = models.CharField(max_length=40)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, db_index=True, null=True, on_delete=models.SET_NULL)
    min_lat = models.FloatField()
    min_lng = models.FloatField()
    max_lat = models.FloatField()
    max_lng = models.FloatField()
    flood_date = models.DateTimeField()
    days_before_flood = models.IntegerField()
    days_after_flood = models.IntegerField()

    class Meta:
        ordering=['-id']  # reverse order in which objects were created

    def __str__(self):
        return f'Floodmap: {self.id}'


# Data related to the output of Floodpy.
class Product(models.Model):
    floodmap = models.OneToOneField(Floodmap, on_delete=models.CASCADE, primary_key=True)
    built_at = models.DateTimeField(default=timezone.now)
    geoserver_workspace = models.CharField(max_length=200)
    esa_world_cover_layer = models.CharField(max_length=200)
    s1_backscatter_layer = models.CharField(max_length=200)
    t_score_layer = models.CharField(max_length=200)
    flooded_regions_layer = models.CharField(max_length=200)
    thumbnail_url_params = models.CharField(max_length=500)
    land_cover_categories = ArrayField(models.IntegerField())
    s1_backscatter_quantiles = ArrayField(models.FloatField())
    t_score_quantiles = ArrayField(models.FloatField())

    def __str__(self):
        return f'Product for {self.floodmap}'


# Job for creating a flood map (Floodpy run).
class Job(models.Model):
    SUCCEEDED_STATUS = 'Succeeded'
    FAILED_STATUS = 'Failed'
    PROGRESSING_STATUS = 'Progressing'

    STATUS_CHOICES = [
        (PROGRESSING_STATUS, 'Progressing'),
        (SUCCEEDED_STATUS, 'Succeeded'),
        (FAILED_STATUS, 'Failed'),
    ]

    STAGE_0 = 'Pending approval'
    STAGE_1 = 'Waiting in queue'
    STAGE_2 = 'Downloading precipitation data'
    STAGE_3 = 'Downloading Sentinel-1 images'
    STAGE_4 = 'Preprocessing Sentinel-1 images'
    STAGE_5 = 'Performing statistical analysis'
    STAGE_6 = 'Classifying floodwater'
    STAGE_7 = 'Committing results'
    STAGE_8 = 'Completed'

    STAGE_CHOICES = [
        (STAGE_0, 'Pending approval'),
        (STAGE_1, 'Waiting in queue'),
        (STAGE_2, 'Downloading precipitation data'),
        (STAGE_3, 'Downloading Sentinel-1 images'),
        (STAGE_4, 'Preprocessing Sentinel-1 images'),
        (STAGE_5, 'Performing statistical analysis'),
        (STAGE_6, 'Classifying floodwater'),
        (STAGE_7, 'Committing results'),
        (STAGE_8, 'Completed'),
    ]
    floodmap = models.OneToOneField(Floodmap, on_delete=models.CASCADE, primary_key=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_CHOICES[0][0])
    stage = models.CharField(max_length=200, choices=STAGE_CHOICES, default=STAGE_CHOICES[0][0])
    error_trace = models.CharField(max_length=200, blank=True)  # allow empty string if no error has occurred
    posted_at = models.DateTimeField(default=timezone.now)


    def __str__(self):
        return f'Job for {self.floodmap}'
