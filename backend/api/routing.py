from django.urls import re_path
from channels.routing import URLRouter
from api import consumers

channels_app = URLRouter([
    re_path(r'ws/api/floodmaps/(?P<floodmapId>\d+)/updates/$', consumers.UpdatesConsumer.as_asgi()),
])
