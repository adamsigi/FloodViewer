from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from .forms import FloodViewerUserChangeForm, FloodViewerUserCreationForm
from .models import FloodViewerUser

admin.site.unregister(Group)

@admin.register(FloodViewerUser)
class FloodViewerUserAdmin(UserAdmin):
    # The forms to add and change user instances.
    form = FloodViewerUserChangeForm
    add_form = FloodViewerUserCreationForm

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserAdmin that reference specific fields on auth.User.
    list_display = ("email", "is_staff", "is_active")
    list_filter = ("is_staff", "is_staff", "is_active")

    fieldsets = (
        (None, {"fields": ("email", "password", "last_password_change")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )

    search_fields = ("email",)
    ordering = ("email",)
