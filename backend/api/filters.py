import django_filters
from api.models import Floodmap, Job
from api.models import Floodmap


class FloodmapFilter(django_filters.FilterSet):
    flood_name = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    max_lat = django_filters.NumberFilter(field_name='max_lat', lookup_expr='lte')
    min_lat = django_filters.NumberFilter(field_name='min_lat', lookup_expr='gte')
    max_lng = django_filters.NumberFilter(field_name='max_lng', lookup_expr='lte')
    min_lng = django_filters.NumberFilter(field_name='min_lng', lookup_expr='gte')
    from_date = django_filters.DateTimeFilter(field_name='flood_date', lookup_expr='gte')
    to_date = django_filters.DateTimeFilter(field_name='flood_date', lookup_expr='lte')
    owned = django_filters.BooleanFilter(method='filter_by_owned')
    succeeded = django_filters.BooleanFilter(method='filter_by_succeeded')
    progressing = django_filters.BooleanFilter(method='filter_by_progressing')
    failed = django_filters.BooleanFilter(method='filter_by_failed')

    class Meta:
        model = Floodmap
        fields = ['flood_name', 'min_lat', 'min_lng',
                  'max_lat', 'max_lng', 'from_date', 'to_date', ]

    # Owner can get his floodmaps and filter them by status
    def filter_by_owned(self, queryset, name, owned):
        user = getattr(self.request, 'user', None)
        # Staff users see all floodmaps
        if user and user.is_staff:
            return queryset
        if user and user.is_authenticated and owned:
            return queryset.filter(owner=user)
        return queryset
    
    def filter_by_succeeded(self, queryset, name, succeeded):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not succeeded:
            return queryset.exclude(job__status=Job.SUCCEEDED_STATUS)
        return queryset
    
    def filter_by_progressing(self, queryset, name, progressing):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not progressing:
            return queryset.exclude(job__status=Job.PROGRESSING_STATUS)
        return queryset
    
    def filter_by_failed(self, queryset, name, failed):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated and not failed:
            return queryset.exclude(job__status=Job.FAILED_STATUS)
        return queryset

    # Non owner can only see succeeded (completed) floodmaps
    @property
    def qs(self):
        parent = super().qs
        user = getattr(self.request, 'user', None)
        owned = self.data.get('owned', None)
        if user and user.is_authenticated and owned:
            return parent

        return parent.filter(job__status=Job.SUCCEEDED_STATUS)
