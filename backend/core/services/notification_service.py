from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.contenttypes.models import ContentType
from apps.ai_api.models import Notification


class NotificationService:
    @staticmethod
    def create_notification(
        recipient,
        notification_type,
        title,
        message,
        content_object=None,
        action_url=None,
        actor=None
    ):
        """Create a notification and send it via WebSocket"""
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            content_type=ContentType.objects.get_for_model(content_object) if content_object else None,
            object_id=content_object.id if content_object else None,
            action_url=action_url,
            actor=actor
        )
        
        # Send real-time notification via WebSocket (if Redis is available)
        try:
            NotificationService.send_realtime_notification(notification)
        except Exception as e:
            # Log the error but don't fail the notification creation
            print(f"Failed to send real-time notification: {e}")
            # The notification is still created in the database
        
        return notification
    
    @staticmethod
    def send_realtime_notification(notification):
        """Send notification through WebSocket"""
        channel_layer = get_channel_layer()
        notification_group = f'user_{notification.recipient.user_id}_notifications'
        
        async_to_sync(channel_layer.group_send)(
            notification_group,
            {
                'type': 'notification_message',
                'notification': {
                    'id': notification.id,
                    'type': notification.notification_type,
                    'title': notification.title,
                    'message': notification.message,
                    'action_url': notification.action_url,
                    'actor': notification.actor.name if notification.actor else None,
                    'created_at': notification.created_at.isoformat(),
                    'is_read': notification.is_read,
                }
            }
        )
    
    @staticmethod
    def mark_as_read(notification_id, user):
        """Mark notification as read"""
        from django.utils import timezone
        notification = Notification.objects.get(id=notification_id, recipient=user)
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return notification
    
    @staticmethod
    def mark_all_as_read(user):
        """Mark all notifications as read for a user"""
        from django.utils import timezone
        Notification.objects.filter(recipient=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
