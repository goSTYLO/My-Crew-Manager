import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accept the connection first to allow authentication message
        await self.accept()
        
        # Set initial state
        self.user = None
        self.user_id = None
        self.notification_group_name = None
        self.authenticated = False
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            
            # Handle authentication message
            if data.get('type') == 'auth' and data.get('token'):
                await self.authenticate_user(data['token'])
            else:
                # Handle other message types if authenticated
                if self.authenticated:
                    await self.handle_message(data)
                else:
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': 'Authentication required'
                    }))
                    
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Error: {str(e)}'
            }))
    
    async def authenticate_user(self, token):
        """Authenticate user using JWT token"""
        try:
            # Validate the JWT token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get the user
            self.user = await self.get_user_by_id(user_id)
            if not self.user:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'User not found'
                }))
                await self.close()
                return
            
            # Set up user-specific group
            self.user_id = self.user.user_id
            self.notification_group_name = f'user_{self.user_id}_notifications'
            
            # Add to user's notification group
            await self.channel_layer.group_add(
                self.notification_group_name,
                self.channel_name
            )
            
            self.authenticated = True
            
            # Send authentication success message
            await self.send(text_data=json.dumps({
                'type': 'auth_success',
                'message': 'Authentication successful',
                'user_id': self.user_id
            }))
            
        except (InvalidToken, TokenError) as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid token'
            }))
            await self.close()
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Authentication error: {str(e)}'
            }))
            await self.close()
    
    async def get_user_by_id(self, user_id):
        """Get user by ID (async wrapper)"""
        try:
            return User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return None
    
    async def handle_message(self, data):
        """Handle authenticated messages"""
        # For now, just echo back the message
        await self.send(text_data=json.dumps({
            'type': 'message_received',
            'data': data
        }))
    
    async def disconnect(self, close_code):
        if self.notification_group_name:
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    # Real-time project update handlers
    async def project_update(self, event):
        """Send project update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'project_update',
            'payload': event['payload']
        }))
    
    async def epic_update(self, event):
        """Send epic update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'epic_update',
            'payload': event['payload']
        }))
    
    async def sub_epic_update(self, event):
        """Send sub-epic update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'sub_epic_update',
            'payload': event['payload']
        }))
    
    async def user_story_update(self, event):
        """Send user story update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_story_update',
            'payload': event['payload']
        }))
    
    async def task_update(self, event):
        """Send task update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'task_update',
            'payload': event['payload']
        }))
    
    async def member_update(self, event):
        """Send member update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'member_update',
            'payload': event['payload']
        }))
    
    async def repository_update(self, event):
        """Send repository update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'repository_update',
            'payload': event['payload']
        }))
    
    async def backlog_regenerated(self, event):
        """Send backlog regeneration notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'backlog_regenerated',
            'payload': event['payload']
        }))
    
    async def overview_regenerated(self, event):
        """Send overview regeneration notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'overview_regenerated',
            'payload': event['payload']
        }))