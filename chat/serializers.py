from rest_framework import serializers
from .models import Room, RoomMembership, Message


class RoomMembershipSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.pk', read_only=True)
    room_id = serializers.IntegerField(source='room.pk', read_only=True)

    class Meta:
        model = RoomMembership
        fields = [
            'membership_id',
            'room_id',
            'user_id',
            'is_admin',
            'joined_at',
        ]
        read_only_fields = ['membership_id', 'joined_at']


class RoomSerializer(serializers.ModelSerializer):
    created_by_id = serializers.IntegerField(source='created_by.pk', read_only=True)
    members_count = serializers.IntegerField(source='memberships.count', read_only=True)

    class Meta:
        model = Room
        fields = [
            'room_id',
            'name',
            'is_private',
            'created_by_id',
            'created_at',
            'members_count',
        ]
        read_only_fields = ['room_id', 'created_at', 'created_by_id', 'members_count']


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source='sender.pk', read_only=True)
    room_id = serializers.IntegerField(source='room.pk', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    reply_to_id = serializers.IntegerField(source='reply_to.message_id', read_only=True)

    class Meta:
        model = Message
        fields = [
            'message_id',
            'room_id',
            'sender_id',
            'sender_username',
            'content',
            'message_type',
            'reply_to_id',
            'created_at',
            'edited_at',
            'is_deleted',
        ]
        read_only_fields = ['message_id', 'created_at', 'edited_at', 'is_deleted', 'sender_id', 'room_id', 'sender_username']



