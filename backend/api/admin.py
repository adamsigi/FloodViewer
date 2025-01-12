from django.contrib import admin
from api.models import Floodmap, Product, Job

# Register your models here.
class FloodmapAdmin(admin.ModelAdmin):
    pass


admin.site.register(Floodmap, FloodmapAdmin)
admin.site.register(Job, FloodmapAdmin)
admin.site.register(Product, FloodmapAdmin)