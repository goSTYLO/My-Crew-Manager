from django.urls import path, include
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from ai_api.routing import websocket_urlpatterns as ai_api_websocket_urlpatterns

# Combine all WebSocket URL patterns
websocket_urlpatterns = chat_websocket_urlpatterns + ai_api_websocket_urlpatterns

application = ProtocolTypeRouter({
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
