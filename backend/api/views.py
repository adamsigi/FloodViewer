import logging
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.pagination import PageNumberPagination
from api.utils import send_job_update_notification
from api.models import Floodmap, Job
from api.serializers import FloodmapSerializer, JobSerializer, FloodmapQueryParamSerializer, JobApprovalSerializer
from api.celery_worker.tasks import run_floodpy, delete_floodmap_products
from api.permissions import IsStaffOrReadOnly
from api.filters import FloodmapFilter
from django.conf import settings

logger = logging.getLogger(__name__)

class ListFloodmaps(APIView):
    """ List all flood maps, or create a new floodmap. """
    permission_classes = [AllowAny]

    def initialize_request(self, request, *args, **kwargs):
        """ Set the throttle scope for posting floodmaps. """
        request = super().initialize_request(request, *args, **kwargs)
        if request.method == 'POST':
            self.throttle_scope = 'floodmap_post'
        if request.method == 'GET':
            self.throttle_scope = 'floodmap_get'
        return request

    def get(self, request):
        query_params_serializer = FloodmapQueryParamSerializer(
            data=request.query_params, context={'request': request})
        if not query_params_serializer.is_valid():
            return Response({"error": "Invalid query parameters", "message": query_params_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        floodmaps_full = Floodmap.objects.select_related('product', 'job')
        filtered_floodmaps_full = FloodmapFilter(
            data=query_params_serializer.data, queryset=floodmaps_full, request=request).qs

        paginator = PageNumberPagination()
        paginator.page_size = settings.PAGE_SIZE
        paginated_floodmaps = paginator.paginate_queryset(
            filtered_floodmaps_full, request)

        floodmap_serializer = FloodmapSerializer(
            paginated_floodmaps, many=True, context={'request': request})
        return paginator.get_paginated_response(floodmap_serializer.data)

    def post(self, request):
        data = request.data
        serializer = FloodmapSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            response_data = serializer.data
            # Only staff users can start jobs.
            if request.user.is_staff:
                pk = serializer.data['id']
                job = Job.objects.get(pk=pk)
                job.stage = Job.STAGE_1
                response_data['job']['stage'] = Job.STAGE_1
                job.status = Job.PROGRESSING_STATUS
                response_data['job']['status'] = Job.PROGRESSING_STATUS
                job.save()
                send_job_update_notification(job)
                run_floodpy.delay_on_commit(pk)
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response({"error": "Invalid floodmap data", "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class DetailFloodmaps(APIView):
    """ Retrieve a floodmap. """
    permission_classes = [IsStaffOrReadOnly]
    throttle_scope = 'floodmap_get'

    def get(self, request, pk):
        try:
            floodmap_full = Floodmap.objects.select_related(
                'product', 'job').get(pk=pk)
            serializer = FloodmapSerializer(
                floodmap_full, context={'request': request})
            return Response(serializer.data)
        except Floodmap.DoesNotExist:
            return Response({"error": "Floodmap not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            floodmap_full = Floodmap.objects.select_related('job', 'product').get(pk=pk)
            self.check_object_permissions(request, floodmap_full)
            if floodmap_full.job.status == Job.PROGRESSING_STATUS:
                return Response({"error": "Cannot delete floodmap while job is in progress"}, status=status.HTTP_400_BAD_REQUEST)
            delete_floodmap_products(pk, floodmap_full.job.status)
            floodmap_full.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Floodmap.DoesNotExist:
            return Response({"error": "Floodmap not found"}, status=status.HTTP_404_NOT_FOUND)


class DetailJobs(APIView):
    """ Retrieve or update (restart) a job. """
    permission_classes = [IsStaffOrReadOnly]
    throttle_scope = 'floodmap_get'

    def get(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            serializer = JobSerializer(job)
            return Response(serializer.data)

        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)


    def patch(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
            # Only staff can patch (approve/disapprove) jobs.
            self.check_object_permissions(request, job.floodmap)
            if job.stage != Job.STAGE_0:
                return Response({"error": "Cannot patch a job that is not pending approval"}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = JobApprovalSerializer(data=request.data)
            if serializer.is_valid():
                if serializer.validated_data['approve']:
                    job.stage = Job.STAGE_1
                    job.status = Job.PROGRESSING_STATUS
                    job.error_trace = ''  # In case of approving a job that was disapproved before.
                    job.save()
                    send_job_update_notification(job)
                    run_floodpy.delay_on_commit(pk)
                else:
                    job.status = Job.FAILED_STATUS
                    job.error_trace = 'The floodmap not was approved by administration.'
                    job.save()
                    send_job_update_notification(job)
                return Response(JobSerializer(job).data, status=status.HTTP_200_OK)
            return Response({"error": "Failed to patch", "message": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
