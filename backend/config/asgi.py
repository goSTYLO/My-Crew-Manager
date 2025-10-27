"""
ASGI config for my_crew_manager project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Now that Django is initialized, we can safely import our custom middleware and routing
from apps.chat.auth import TokenAuthMiddlewareStack
import apps.chat.routing
from apps.ai_api.routing import websocket_urlpatterns as ai_websocket_urlpatterns

# Combine all WebSocket URL patterns
websocket_urlpatterns = apps.chat.routing.websocket_urlpatterns + ai_websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": TokenAuthMiddlewareStack(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
