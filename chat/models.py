from django.db import models
from django.conf import settings


class Room(models.Model):
    """Chat room for group or direct messages.

    A room can be named (group) or unnamed (for direct messages, name optional).
    """
    room_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    is_private = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rooms_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_room'
        ordering = ['-created_at']

    def __str__(self):
        return self.name or f"Room {self.room_id}"


class RoomMembership(models.Model):
    """Membership linking users to rooms with roles."""
    membership_id = models.AutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chat_memberships')
    is_admin = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_room_membership'
        unique_together = ('room', 'user')


class Message(models.Model):
    """Messages posted in a room."""
    message_id = models.AutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages_sent')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    # Optional fields for enhanced real-time features
    message_type = models.CharField(max_length=20, default='text', choices=[
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('system', 'System'),
    ])
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')

    class Meta:
        db_table = 'chat_message'
        ordering = ['created_at']

