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
from chat.auth import TokenAuthMiddlewareStack
import chat.routing
from ai_api.routing import websocket_urlpatterns as ai_websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_crew_manager.settings')

django_asgi_app = get_asgi_application()

# Combine all WebSocket URL patterns
websocket_urlpatterns = chat.routing.websocket_urlpatterns + ai_websocket_urlpatterns

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
