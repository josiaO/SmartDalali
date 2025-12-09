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

from django.conf import settings
from django.conf.urls.static import static




import os

def empty_favicon(request):
    return HttpResponse("", content_type="image/x-icon")


from shortlinks.views import redirect_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('s/<str:code>/', redirect_view, name='shortlink-redirect'),
    path('accounts/', include('allauth.urls')),
    path('api/v1/properties/', include('properties.urls')),
    path('api/v1/support/', include('properties.support_urls')),

    # Unified API root
    path('api/v1/communications/', include('communications.urls')),
    path('api/v1/agents/stats/', agent_stats, name='agent-stats'),
    path("api/v1/insights/", include("insights.urls")),
    path("api/v1/features/", include("features.urls")),
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/shortlinks/', include('shortlinks.urls')),



    path('api/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='api-schema'), name='api-docs-redoc'),
    path('favicon.ico', empty_favicon),
]
from django.views.static import serve
from django.urls import re_path

if settings.DEBUG or os.getenv('DJANGO_ENV') != 'production':
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Fallback for serving media files if static() helper doesn't work (e.g. some Channels configs)
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
