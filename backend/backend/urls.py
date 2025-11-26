from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

# Trigger admin dashboard customizations
from . import admin as admin_dashboard  # noqa: F401
from properties.views import agent_stats

def empty_favicon(request):
    return HttpResponse("", content_type="image/x-icon")


urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),

    # Unified API root
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/properties/', include('properties.urls')),
    path('api/v1/communications/', include('communications.urls')),
    path('api/v1/agents/stats/', agent_stats, name='agent-stats'),
    path('api/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='api-schema'), name='api-docs-redoc'),
    path('favicon.ico', empty_favicon),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
