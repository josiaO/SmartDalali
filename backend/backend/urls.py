from django.contrib import admin
from django.urls import path, include

# Trigger admin dashboard customizations
from . import admin as admin_dashboard  # noqa: F401

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),

    # Unified API root
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/properties/', include('properties.urls')),
    path('api/v1/communications/', include('communications.urls')),
]
