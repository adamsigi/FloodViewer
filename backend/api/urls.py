from django.urls import path
from api import views

urlpatterns = [
    path('floodmaps/', views.ListFloodmaps.as_view(), name='list-floodmaps'),
    path('floodmaps/<int:pk>/', views.DetailFloodmaps.as_view(), name='detail-floodmaps'),
    path('jobs/<int:pk>/', views.DetailJobs.as_view(), name='detail-jobs'),
]
