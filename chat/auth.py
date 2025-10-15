from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token


class TokenAuthMiddleware:
    """Simple ASGI middleware for Channels to authenticate users via ?token= query.

    Place this outside the default Django AuthMiddleware so that scope['user'] is set
    for WebSocket connections that include a DRF token in the query string.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Default to anonymous; only override for websocket connections
        scope_user = scope.get("user", AnonymousUser())

        if scope.get("type") == "websocket":
            query_string = scope.get("query_string", b"")
            try:
                query = parse_qs(query_string.decode())
            except Exception:
                query = {}
            token_key_list = query.get("token") or query.get("auth_token")
            if token_key_list:
                token_key = token_key_list[0]
                try:
                    token = Token.objects.select_related("user").get(key=token_key)
                    scope_user = token.user
                except Token.DoesNotExist:
                    scope_user = AnonymousUser()

        scope["user"] = scope_user
        return await self.inner(scope, receive, send)


def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)


