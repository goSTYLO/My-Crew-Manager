import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count
from .models import Room, RoomMembership, Message
from .serializers import MessageSerializer, RoomSerializer, RoomMembershipSerializer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Check if user is authenticated and is a member of the room
        if not await self.is_authenticated_and_member():
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send user joined message
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_joined',
                'user': self.scope['user'].name,
                'user_id': self.scope['user'].pk,
            }
        )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Send user left message
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user_left',
                'user': self.scope['user'].name,
                'user_id': self.scope['user'].pk,
            }
        )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            # WebSocket only handles real-time events, not data operations
            if message_type == 'typing':
                await self.handle_typing(text_data_json)
            elif message_type == 'stop_typing':
                await self.handle_stop_typing(text_data_json)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'WebSocket only handles real-time events. Use REST API for data operations. Unknown type: {message_type}'
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    # WebSocket only handles real-time events, not data operations
    # All data operations (messages, rooms, users) are handled via REST API

    async def handle_typing(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing',
                'user': self.scope['user'].username,
                'user_id': self.scope['user'].id,
            }
        )

    async def handle_stop_typing(self, data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'stop_typing',
                'user': self.scope['user'].username,
                'user_id': self.scope['user'].id,
            }
        )

    # WebSocket event handlers
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'user': event['user'],
            'user_id': event['user_id'],
        }))

    async def typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user': event['user'],
            'user_id': event['user_id'],
        }))

    async def stop_typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'stop_typing',
            'user': event['user'],
            'user_id': event['user_id'],
        }))

    async def user_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user'],
            'user_id': event['user_id'],
        }))

    async def user_left(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user': event['user'],
            'user_id': event['user_id'],
        }))

    @database_sync_to_async
    def is_authenticated_and_member(self):
        """Check if user is authenticated and is a member of the room"""
        if not self.scope['user'].is_authenticated:
            return False
        
        try:
            room = Room.objects.get(room_id=self.room_id)
            return RoomMembership.objects.filter(
                room=room, 
                user=self.scope['user']
            ).exists()
        except Room.DoesNotExist:
            return False

    @database_sync_to_async
    def create_message(self, content, message_type='text', reply_to_id=None):
        """Create a message in the database"""
        try:
            with transaction.atomic():
                room = Room.objects.get(room_id=self.room_id)
                message = Message.objects.create(
                    room=room,
                    sender=self.scope['user'],
                    content=content,
                    message_type=message_type,
                    reply_to_id=reply_to_id
                )
                # Serialize the message for sending
                serializer = MessageSerializer(message)
                return serializer.data
        except Exception as e:
            print(f"Error creating message: {e}")
            return None

    # All data operations are handled via REST API
    # WebSocket only handles real-time events like typing indicators

    # All data operations (rooms, messages, users) are handled via REST API
    # WebSocket consumers only handle real-time events like typing indicators


class ChatNotificationConsumer(AsyncWebsocketConsumer):
    """Consumer for global chat notifications (new messages, mentions, etc.)"""
    
    async def connect(self):
        if not self.scope['user'].is_authenticated:
            await self.close()
            return
        
        self.user_id = self.scope['user'].id
        self.notification_group_name = f'user_{self.user_id}_notifications'
        
        # Join user's notification group
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave notification group
        await self.channel_layer.group_discard(
            self.notification_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # This consumer is mainly for receiving notifications
        # No need to handle incoming messages
        pass

    async def new_message_notification(self, event):
        """Send notification about new message in a room"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'room_id': event['room_id'],
            'message': event['message'],
            'sender': event['sender'],
        }))

    async def mention_notification(self, event):
        """Send notification about being mentioned in a message"""
        await self.send(text_data=json.dumps({
            'type': 'mention',
            'room_id': event['room_id'],
            'message': event['message'],
            'sender': event['sender'],
        }))

    async def room_invitation(self, event):
        """Notify the user that they were invited to a room"""
        await self.send(text_data=json.dumps({
            'type': 'room_invitation',
            'room_id': event.get('room_id'),
            'room_name': event.get('room_name'),
            'invited_by': event.get('invited_by'),
        }))

    async def direct_room_created(self, event):
        """Notify the user that a direct room was created with them"""
        await self.send(text_data=json.dumps({
            'type': 'direct_room_created',
            'room': event.get('room'),
            'created_by': event.get('created_by'),
        }))