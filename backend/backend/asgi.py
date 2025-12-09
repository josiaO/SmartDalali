import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from communications.middleware import JWTAuthMiddleware
import communications.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = ProtocolTypeRouter({
  "http": get_asgi_application(),
  "websocket": JWTAuthMiddleware(
        URLRouter(
            communications.routing.websocket_urlpatterns
        )
    ),
})