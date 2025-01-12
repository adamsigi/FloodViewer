from rest_framework import serializers
from django.utils import timezone
from datetime import datetime
from django.db import transaction
from api.models import Floodmap, Job, Product
from haversine import haversine, Unit
from floodviewer.settings import MAX_BBOX_SIDE_DISTANCE

    
class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret['error_trace']:
            del ret['error_trace']
        return ret


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class BBoxSerializer(serializers.Serializer):
    min_lat = serializers.FloatField(min_value=-90.0, max_value=90.0)
    min_lng = serializers.FloatField(min_value=-180.0, max_value=180.0)
    max_lat = serializers.FloatField(min_value=-90.0, max_value=90.0)
    max_lng = serializers.FloatField(min_value=-180.0, max_value=180.0)

    def _clean_coordinate(self, value):
        if value:
            return round(value, 3)
        return value

    def validate_min_lat(self, min_lat):
        return self._clean_coordinate(min_lat)

    def validate_min_lng(self, min_lng):
        return self._clean_coordinate(min_lng)

    def validate_max_lat(self, max_lat):
        return self._clean_coordinate(max_lat)

    def validate_max_lng(self, max_lng):
        return self._clean_coordinate(max_lng)

    def validate(self, bbox):
        min_lat = bbox['min_lat']
        min_lng = bbox['min_lng']
        max_lat = bbox['max_lat']
        max_lng = bbox['max_lng']
        errors = {}
        if min_lat and max_lat and min_lat >= max_lat:
            errors['min_lat'] = 'min_lat must be less than max_lat'
            errors['max_lat'] = 'max_lat must be greater than min_lat'
            raise serializers.ValidationError(errors)

        if min_lng and max_lng and min_lng >= max_lng:
            errors['min_lng'] = 'min_lng must be less than max_lng'
            errors['max_lng'] = 'max_lng must be greater than min_lng'
            raise serializers.ValidationError(errors)
        
        vertical_distance = haversine((min_lat, min_lng), (max_lat, min_lng), unit=Unit.KILOMETERS)
        if vertical_distance > MAX_BBOX_SIDE_DISTANCE:
            errors['vertical_distance'] = f'The vertical distance must not exceed {MAX_BBOX_SIDE_DISTANCE}'
            raise serializers.ValidationError(errors)
        
        horizontal_distance = haversine((min_lat, min_lng), (min_lat, max_lng), unit=Unit.KILOMETERS)
        if horizontal_distance > MAX_BBOX_SIDE_DISTANCE:
            errors['horizontal_distance'] = f'The horizontal distance must not exceed {MAX_BBOX_SIDE_DISTANCE}'
            raise serializers.ValidationError(errors)

        return bbox


class FloodmapSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField()
    name = serializers.CharField(min_length=3, max_length=40)
    bbox = BBoxSerializer(source='*')
    days_before_flood = serializers.IntegerField(min_value=10, max_value=60)
    days_after_flood = serializers.IntegerField(min_value=1, max_value=6)
    job = JobSerializer(read_only=True)
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Floodmap
        fields = ['id', 'name', 'bbox', 'flood_date',
                  'days_before_flood', 'days_after_flood', 'job', 'product']

    def create(self, validated_data):
        request = self.context.get('request', None)
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        else:
            validated_data['owner'] = None

        with transaction.atomic():
            floodmap = Floodmap.objects.create(**validated_data)
            Job.objects.create(floodmap=floodmap)
            return floodmap

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        for prop in ['job', 'product']:
            if ret[prop]:
                # remove floodmap id from job and product to avoid duplication
                del ret[prop]['floodmap']
            else:
                del ret[prop]  # remove empty properties (reduces payload size)

        request = self.context.get('request', None)
        # Users can create (propose) floodmaps but they don't own them!
        if request and request.user.is_staff:
            ret['owned'] = True
        return ret

    def validate_flood_date(self, flood_date):
        current_datetime = timezone.now()
        min_datetime_allowed = timezone.make_aware(datetime(2014, 4, 3))  # Sentinel-1 launch?
        if flood_date > current_datetime:
            raise serializers.ValidationError(
                'The flood event datetime (in UTC) cannot be in the future')

        elif flood_date < min_datetime_allowed:
            raise serializers.ValidationError(
                f'The flood event datetime must be after {min_datetime_allowed}, which is the launch date of Sentinel-1')

        return flood_date


class JobApprovalSerializer(serializers.Serializer):
    approve = serializers.BooleanField(required=True,)


class FloodmapQueryParamSerializer(serializers.Serializer):
    flood_name = serializers.CharField(required=False, min_length=2, max_length=40)
    min_lat = serializers.FloatField(required=False, min_value=-90.0, max_value=90.0)
    min_lng = serializers.FloatField(required=False, min_value=-180.0, max_value=180.0)
    max_lat = serializers.FloatField(required=False, min_value=-90.0, max_value=90.0)
    max_lng = serializers.FloatField(required=False, min_value=-180.0, max_value=180.0)
    from_date = serializers.DateField(required=False, input_formats=['%d/%m/%Y'])
    to_date = serializers.DateField(required=False, input_formats=['%d/%m/%Y'])
    owned = serializers.BooleanField(required=False, allow_null=True)
    succeeded = serializers.BooleanField(required=False, allow_null=True)
    progressing = serializers.BooleanField(required=False, allow_null=True)
    failed = serializers.BooleanField(required=False, allow_null=True)

    def validate(self, data):
        min_lat = data.get('min_lat')
        min_lng = data.get('min_lng')
        max_lat = data.get('max_lat')
        max_lng = data.get('max_lng')

        errors = {}
        if min_lat and max_lat and min_lat >= max_lat:
            errors['min_lat'] = 'min_lat must be less than max_lat'
            errors['max_lat'] = 'max_lat must be greater than min_lat'

        if min_lng and max_lng and min_lng >= max_lng:
            errors['min_lng'] = 'min_lng must be less than max_lng'
            errors['max_lng'] = 'max_lng must be greater than min_lng'

        from_date = data.get('from_date')
        to_date = data.get('to_date')

        current_datetime = timezone.now().date()
        min_datetime_allowed = timezone.make_aware(
            datetime(2014, 4, 3)).date()

        if from_date and from_date > current_datetime:
            errors['from_date'] = 'The flood event datetime (in UTC) cannot be in the future'
        elif from_date and from_date < min_datetime_allowed:
            errors['from_date'] = f'The flood event datetime (in UTC) must be after {min_datetime_allowed}, which is the launch date of Sentinel-1'

        if to_date and to_date > current_datetime:
            errors['to_date'] = 'The flood event datetime (in UTC) cannot be in the future'
        elif to_date and to_date < min_datetime_allowed:
            errors['to_date'] = f'The flood event datetime (in UTC) must be after {min_datetime_allowed}, which is the launch date of Sentinel-1'

        if from_date and to_date and from_date > to_date:
            errors['from_date'] = 'From date must be before To date'
            errors['to_date'] = 'To date must be after From date'

        owned = data.get('owned')
        succeeded = data.get('succeeded')
        progressing = data.get('progressing')
        failed = data.get('failed')
        
        request = self.context.get('request', None) 
        if owned != None and not request.user.is_authenticated:
            errors['owned'] = 'Cannot filter by owned floodmaps and not be logged in'

        if succeeded != None and not request.user.is_authenticated:
            errors['succeeded'] = 'Cannot filter by succeeded floodmaps and not be logged in'

        if progressing != None and not request.user.is_authenticated:
            errors['progressing'] = 'Cannot filter by progressing floodmaps and not be logged in'

        if failed != None and not request.user.is_authenticated:
            errors['failed'] = 'Cannot filter by failed floodmaps and not be logged in'

        if errors:
            raise serializers.ValidationError(errors)

        return data
