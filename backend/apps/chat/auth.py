from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from channels.db import database_sync_to_async

User = get_user_model()


class TokenAuthMiddleware:
    """ASGI middleware for Channels to authenticate users via DRF token in query string."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Default to anonymous
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
                print(f"WebSocket auth: Attempting to authenticate with token: {token_key[:10]}...")
                try:
                    # Validate DRF token
                    scope_user = await self.get_user_by_token(token_key)
                    if scope_user.is_authenticated:
                        print(f"WebSocket auth: Successfully authenticated user {scope_user.user_id}")
                    else:
                        print(f"WebSocket auth: Token validation failed - user not authenticated")
                except Exception as e:
                    print(f"WebSocket token authentication error: {e}")
                    scope_user = AnonymousUser()
            else:
                print(f"WebSocket auth: No token found in query string: {query_string.decode()}")

        scope["user"] = scope_user
        return await self.inner(scope, receive, send)
    
    @database_sync_to_async
    def get_user_by_token(self, token_key):
        try:
            print(f"WebSocket auth: Looking up token: {token_key[:10]}...")
            token_obj = Token.objects.get(key=token_key)
            print(f"WebSocket auth: Found token for user: {token_obj.user.email}")
            return token_obj.user
        except Token.DoesNotExist:
            print(f"WebSocket auth: Token not found in database")
            return AnonymousUser()
        except Exception as e:
            print(f"WebSocket auth: Error looking up token: {e}")
            return AnonymousUser()


def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)