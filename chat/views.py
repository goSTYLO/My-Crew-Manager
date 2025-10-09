"""
Hybrid Chat System: REST API for data operations + WebSocket for real-time updates
"""
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Room, RoomMembership, Message
from .serializers import RoomSerializer, RoomMembershipSerializer, MessageSerializer
from .permissions import IsAuthenticatedAndRoomMember, IsRoomAdmin


def send_room_notification(room_id, notification_type, data):
    """Send real-time notification to all members of a room"""
    channel_layer = get_channel_layer()
    room_group_name = f'chat_{room_id}'
    
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            'type': notification_type,
            **data
        }
    )


def send_user_notification(user_id, notification_type, data):
    """Send real-time notification to a specific user"""
    channel_layer = get_channel_layer()
    user_group_name = f'user_{user_id}_notifications'
    
    async_to_sync(channel_layer.group_send)(
        user_group_name,
        {
            'type': notification_type,
            **data
        }
    )


class RoomViewSet(viewsets.ModelViewSet):
    """REST API for room management with real-time WebSocket notifications"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only list rooms where the user is a member
        if self.action == 'list':
            return Room.objects.filter(memberships__user=self.request.user).distinct()
        return super().get_queryset()

    def perform_create(self, serializer):
        with transaction.atomic():
            room = serializer.save(created_by=self.request.user)
            RoomMembership.objects.create(room=room, user=self.request.user, is_admin=True)
            
            # Send real-time notification
            send_room_notification(room.room_id, 'room_created', {
                'room': RoomSerializer(room).data,
                'created_by': self.request.user.username,
            })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticatedAndRoomMember, IsRoomAdmin])
    def invite(self, request, pk=None):
        room = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        membership, created = RoomMembership.objects.get_or_create(room=room, user_id=user_id)
        
        if created:
            # Send real-time notifications
            send_user_notification(user_id, 'room_invitation', {
                'room_id': room.room_id,
                'room_name': room.name or f"Room {room.room_id}",
                'invited_by': request.user.username,
            })
            
            send_room_notification(room.room_id, 'user_joined', {
                'user': membership.user.username,
                'user_id': membership.user.id,
            })
        
        return Response({'detail': 'User invited/added successfully'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticatedAndRoomMember, IsRoomAdmin])
    def remove_member(self, request, pk=None):
        room = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        membership = RoomMembership.objects.filter(room=room, user_id=user_id).first()
        if membership:
            membership.delete()
            
            # Send real-time notification
            send_room_notification(room.room_id, 'user_left', {
                'user': membership.user.username,
                'user_id': membership.user.id,
            })
        
        return Response({'detail': 'Member removed'})

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticatedAndRoomMember])
    def members(self, request, pk=None):
        room = self.get_object()
        memberships = room.memberships.select_related('user').all()
        data = RoomMembershipSerializer(memberships, many=True).data
        return Response(data)

    @action(detail=False, methods=['post'], url_path='direct')
    def direct(self, request):
        """Get or create a 1:1 private room with another user."""
        other_user_id = request.data.get('user_id')
        if not other_user_id:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if int(other_user_id) == int(request.user.pk):
            return Response({'detail': 'user_id must be different from current user'}, status=status.HTTP_400_BAD_REQUEST)

        # Find existing private room with exactly these two members
        from django.db.models import Count
        existing = (
            Room.objects.filter(is_private=True, memberships__user=request.user)
            .filter(memberships__user_id=other_user_id)
            .annotate(num_members=Count('memberships'))
            .filter(num_members=2)
            .first()
        )
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data)

        # Create new private room and add both users
        with transaction.atomic():
            room = Room.objects.create(created_by=request.user, is_private=True, name=None)
            RoomMembership.objects.create(room=room, user=request.user, is_admin=True)
            RoomMembership.objects.get_or_create(room=room, user_id=other_user_id)
            
            # Send real-time notification
            send_room_notification(room.room_id, 'direct_room_created', {
                'room': RoomSerializer(room).data,
                'created_by': request.user.username,
            })
        
        serializer = self.get_serializer(room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageViewSet(mixins.ListModelMixin,
                     mixins.CreateModelMixin,
                     mixins.DestroyModelMixin,
                     viewsets.GenericViewSet):
    """REST API for message operations with real-time WebSocket notifications"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticatedAndRoomMember]

    def get_queryset(self):
        room_id = self.kwargs.get('room_pk')
        return Message.objects.filter(room_id=room_id, is_deleted=False).select_related('sender').order_by('created_at')

    def create(self, request, *args, **kwargs):
        room_id = self.kwargs.get('room_pk')
        get_object_or_404(RoomMembership, room_id=room_id, user=request.user)
        
        # Get message data
        message_data = {
            'content': request.data.get('content'),
            'message_type': request.data.get('message_type', 'text'),
            'reply_to_id': request.data.get('reply_to_id')
        }
        
        serializer = self.get_serializer(data=message_data)
        serializer.is_valid(raise_exception=True)
        
        # Create message
        message = Message.objects.create(
            room_id=room_id,
            sender=request.user,
            content=serializer.validated_data['content'],
            message_type=serializer.validated_data.get('message_type', 'text'),
            reply_to_id=serializer.validated_data.get('reply_to_id')
        )
        
        # Send real-time notification to room
        message_data = self.get_serializer(message).data
        send_room_notification(room_id, 'new_message', {
            'message': message_data,
            'sender': request.user.username,
            'sender_id': request.user.id,
        })
        
        # Send notifications to room members who aren't currently connected
        room = Room.objects.get(room_id=room_id)
        for membership in room.memberships.exclude(user=request.user):
            send_user_notification(membership.user.id, 'new_message_notification', {
                'room_id': room_id,
                'message': message_data,
                'sender': request.user.username,
            })
        
        out = self.get_serializer(message)
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Soft delete by sender or room admin
        if instance.sender_id != request.user.pk and not RoomMembership.objects.filter(room=instance.room, user=request.user, is_admin=True).exists():
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
        
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])
        
        # Send real-time notification
        send_room_notification(instance.room.room_id, 'message_deleted', {
            'message_id': instance.message_id,
            'deleted_by': request.user.username,
        })
        
        return Response(status=status.HTTP_204_NO_CONTENT)
