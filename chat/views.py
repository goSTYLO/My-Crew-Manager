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
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        room_group_name = f'chat_{room_id}'
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': notification_type,
                **data
            }
        )
    except Exception:
        # In tests or when Redis is unavailable, skip real-time send
        return


def send_user_notification(user_id, notification_type, data):
    """Send real-time notification to a specific user"""
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        user_group_name = f'user_{user_id}_notifications'
        async_to_sync(channel_layer.group_send)(
            user_group_name,
            {
                'type': notification_type,
                **data
            }
        )
    except Exception:
        # In tests or when Redis is unavailable, skip real-time send
        return


class RoomViewSet(viewsets.ModelViewSet):
    """REST API for room management with real-time WebSocket notifications"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only allow access to rooms where the user is a member for all actions
        base_qs = Room.objects.filter(memberships__user=self.request.user).distinct()
        return base_qs

    def get_permissions(self):
        # Enforce membership for all room detail actions; admin for specific actions
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy', 'members']:
            return [IsAuthenticatedAndRoomMember()]
        if self.action in ['invite', 'remove_member']:
            return [IsAuthenticatedAndRoomMember(), IsRoomAdmin()]
        return super().get_permissions()

    def perform_create(self, serializer):
        with transaction.atomic():
            room = serializer.save(created_by=self.request.user)
            RoomMembership.objects.create(room=room, user=self.request.user, is_admin=True)
            
            # Send real-time notification
            send_room_notification(room.room_id, 'room_created', {
                'room': RoomSerializer(room).data,
                'created_by': self.request.user.name,
            })
            # Optionally notify creator's devices via user notifications
            send_user_notification(self.request.user.pk, 'room_invitation', {
                'room_id': room.room_id,
                'room_name': room.name or f"Room {room.room_id}",
                'invited_by': self.request.user.name,
            })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticatedAndRoomMember, IsRoomAdmin])
    def invite(self, request, pk=None):
        room = self.get_object()
        email = request.data.get('email')
        if not email:
            return Response({'detail': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(RoomMembership._meta.get_field('user').remote_field.model, email=email)
        membership, created = RoomMembership.objects.get_or_create(room=room, user=user)
        
        if created:
            # Send real-time notifications
            send_user_notification(user.pk, 'room_invitation', {
                'room_id': room.room_id,
                'room_name': room.name or f"Room {room.room_id}",
                'invited_by': request.user.name,
            })
            
            send_room_notification(room.room_id, 'user_joined', {
                'user': membership.user.name,
                'user_id': membership.user.pk,
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
                'user': membership.user.name,
                'user_id': membership.user.pk,
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
        """Get or create a 1:1 private room with another user by email."""
        other_email = request.data.get('email')
        if not other_email:
            return Response({'detail': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)

        other_user = get_object_or_404(RoomMembership._meta.get_field('user').remote_field.model, email=other_email)
        if int(other_user.pk) == int(request.user.pk):
            return Response({'detail': 'email must be different from current user'}, status=status.HTTP_400_BAD_REQUEST)

        # Find existing private room for exactly these two users
        existing = (
            Room.objects.filter(is_private=True)
            .filter(memberships__user=request.user)
            .filter(memberships__user_id=other_user.pk)
            .distinct()
            .first()
        )
        if existing:
            serializer = self.get_serializer(existing)
            # Notify the other user they have an active direct chat
            send_user_notification(other_user.pk, 'direct_room_created', {
                'room': serializer.data,
                'created_by': request.user.name,
            })
            return Response(serializer.data)

        # Create new private room and add both users
        with transaction.atomic():
            room = Room.objects.create(created_by=request.user, is_private=True, name=None)
            RoomMembership.objects.create(room=room, user=request.user, is_admin=True)
            RoomMembership.objects.get_or_create(room=room, user=other_user)
            
            # Send real-time notification
            send_room_notification(room.room_id, 'direct_room_created', {
                'room': RoomSerializer(room).data,
                'created_by': request.user.name,
            })
            # Notify the other user directly as well
            send_user_notification(other_user.pk, 'direct_room_created', {
                'room': RoomSerializer(room).data,
                'created_by': request.user.name,
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
        
        serializer = self.get_serializer(data=message_data, context={'room_id': room_id})
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
        # Align WebSocket event name with consumer handler
        send_room_notification(room_id, 'chat_message', {
            'message': message_data,
            'user': request.user.name,
            'user_id': request.user.pk,
        })
        
        # Send notifications to room members who aren't currently connected
        room = Room.objects.get(room_id=room_id)
        for membership in room.memberships.exclude(user=request.user):
            send_user_notification(membership.user.pk, 'new_message_notification', {
                'room_id': room_id,
                'message': message_data,
                'sender': request.user.name,
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
            'deleted_by': request.user.name,
        })
        
        return Response(status=status.HTTP_204_NO_CONTENT)
