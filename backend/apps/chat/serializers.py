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
    sender_username = serializers.CharField(source='sender.name', read_only=True)
    # Writable input; we also expose the reply_to_id in to_representation
    reply_to_id = serializers.IntegerField(required=False, allow_null=True)

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

    def validate(self, attrs):
        message_type = attrs.get('message_type', 'text')
        content = attrs.get('content')
        if message_type == 'text':
            if content is None or str(content).strip() == '':
                raise serializers.ValidationError({'content': 'Content cannot be empty for text messages.'})
        return attrs

    def validate_reply_to_id(self, reply_to_id):
        # Ensure reply target exists and belongs to the same room when available in context
        if reply_to_id is None:
            return reply_to_id
        try:
            reply_msg = Message.objects.get(message_id=reply_to_id)
        except Message.DoesNotExist:
            raise serializers.ValidationError('Reply-to message does not exist.')

        # If a room is provided in context (e.g., from view), ensure same-room reply
        room_id = None
        if self.context and 'room_id' in self.context:
            room_id = self.context['room_id']
        elif self.instance is not None:
            room_id = getattr(self.instance, 'room_id', None)

        if room_id is not None and reply_msg.room_id != int(room_id):
            raise serializers.ValidationError('Reply-to message must be in the same room.')
        return reply_to_id

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure reply_to_id is present in output using model FK id
        data['reply_to_id'] = getattr(instance, 'reply_to_id', None)
        return data



