import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()
logger = logging.getLogger('apps.ai_api')

class ProjectUpdatesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=')[1]
                break
        
        if not token:
            await self.close()
            return
        
        # Authenticate user using DRF token
        user = await self.authenticate_token(token)
        if not user:
            await self.close()
            return
        
        self.user_id = user.user_id
        self.group_name = f'user_{self.user_id}_updates'
        self.notification_group_name = f'user_{self.user_id}_notifications'
        
        # Join user's personal group for project updates
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        # Join user's notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send connection success
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'user_id': self.user_id
        }))
    
    @database_sync_to_async
    def authenticate_token(self, token):
        try:
            # Use DRF Token authentication
            token_obj = Token.objects.get(key=token)
            return token_obj.user
        except Token.DoesNotExist:
            return None
    
    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    # Handler for all project update events
    async def project_event(self, event):
        await self.send(text_data=json.dumps(event['data']))
    
    # Handler for notification broadcasts
    async def notification_message(self, event):
        """Handler for notification broadcasts"""
        logger.debug(f"Consumer received notification_message event: {event}")
        logger.debug(f"Sending to WebSocket client: {event['notification']}")
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'action': 'notification_created',
            'notification': event['notification']
        }))
        logger.info(f"Notification sent to WebSocket client successfully")
