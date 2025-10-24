import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if not self.scope['user'].is_authenticated:
            await self.close()
            return
        
        self.user_id = self.scope['user'].user_id
        self.notification_group_name = f'user_{self.user_id}_notifications'
        
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
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