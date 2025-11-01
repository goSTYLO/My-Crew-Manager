#views.py
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
        # For chat notifications, use the chat notification group
        # Other notifications use the general notifications group
        if notification_type in ['new_message_notification', 'unread_count_updated', 'room_invitation', 'direct_room_created']:
            user_group_name = f'user_{user_id}_chat_notifications'
        else:
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
            
            # Send notification to room with user email for system message
            send_room_notification(room.room_id, 'user_joined', {
                'user': membership.user.name,
                'user_id': membership.user.pk,
                'user_email': membership.user.email,  # Include email for system message
                'invited_by': request.user.name,
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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticatedAndRoomMember])
    def mark_read(self, request, pk=None):
        """Mark all messages in a room as read by updating user's joined_at timestamp"""
        from django.utils import timezone
        from django.db import transaction
        from datetime import timedelta
        
        room = self.get_object()
        membership = RoomMembership.objects.filter(room=room, user=request.user).first()
        
        if not membership:
            return Response({'detail': 'You are not a member of this room'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get the most recent message timestamp in this room to ensure all messages are marked as read
        # We need to find the absolute latest message (even if deleted) to ensure we mark everything correctly
        latest_message = Message.objects.filter(
            room=room
        ).order_by('-created_at').first()
        
        # Use current time as baseline
        current_time = timezone.now()
        
        if latest_message:
            # Set joined_at to be slightly after the latest message to ensure all existing messages are marked as read
            # Use max() to ensure we're always in the future, and add 2 seconds for safety
            latest_message_time = latest_message.created_at
            new_joined_at = max(current_time, latest_message_time) + timedelta(seconds=2)
        else:
            # No messages yet, use current time
            new_joined_at = current_time
        
        membership.joined_at = new_joined_at
        
        # Force save and refresh from database to ensure transaction commits
        with transaction.atomic():
            membership.save(update_fields=['joined_at'])
            # Refresh from database to ensure we have the latest data
            membership.refresh_from_db()
        
        # Verify the update by checking unread count for this room AFTER the transaction commits
        # Query again from fresh to ensure we get the updated joined_at value
        membership.refresh_from_db()
        room_unread_count = Message.objects.filter(
            room=room,
            created_at__gt=membership.joined_at,
            is_deleted=False
        ).exclude(sender=request.user).count()
        
        # IMPORTANT: Recalculate total unread count AFTER the transaction commits
        # This ensures we get the most accurate count with the updated joined_at timestamp
        # Calculate total unread count across all rooms for real-time badge update
        # Refresh all memberships to ensure we have the latest joined_at values
        memberships = RoomMembership.objects.filter(user=request.user).select_related('room')
        
        # Force refresh of the current membership to ensure we have the updated joined_at
        membership.refresh_from_db()
        
        total_unread = 0
        for memb in memberships:
            # Refresh each membership to ensure we have latest joined_at
            memb.refresh_from_db()
            unread = Message.objects.filter(
                room=memb.room,
                created_at__gt=memb.joined_at,
                is_deleted=False
            ).exclude(sender=request.user).count()
            total_unread += unread
        
        # Ensure total_unread is never negative
        total_unread = max(0, total_unread)
        
        # Send WebSocket notification with updated unread count for real-time badge update
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"📊 Sending unread_count_updated WebSocket notification: user_id={request.user.pk}, total_unread={total_unread}, room_id={room.room_id}")
        send_user_notification(request.user.pk, 'unread_count_updated', {
            'unread_count': total_unread,
            'room_id': room.room_id,
        })
        
        return Response({
            'status': 'marked as read', 
            'room_id': room.room_id,
            'joined_at': membership.joined_at.isoformat(),
            'unread_count': room_unread_count,  # Return unread count for this room for verification
            'total_unread_count': total_unread,  # Return total unread count for badge update (always >= 0)
            'latest_message_at': latest_message.created_at.isoformat() if latest_message else None
        })

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get total unread messages count across all user's rooms"""
        try:
            # Get user's memberships with related rooms
            # Refresh from database to ensure we have latest joined_at values
            memberships = RoomMembership.objects.filter(user=request.user).select_related('room')
            
            total_unread = 0
            
            for membership in memberships:
                # Refresh membership to ensure we have latest joined_at
                membership.refresh_from_db()
                room = membership.room
                # Count messages after user joined, excluding their own messages
                unread = Message.objects.filter(
                    room=room,
                    created_at__gt=membership.joined_at,
                    is_deleted=False
                ).exclude(sender=request.user).count()
                total_unread += unread
            
            # Ensure total_unread is never negative
            total_unread = max(0, total_unread)
            
            return Response({'unread_count': total_unread})
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in unread_count endpoint: {str(e)}")
            return Response({'error': 'Failed to fetch unread count'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        queryset = Message.objects.filter(room_id=room_id, is_deleted=False).select_related('sender')
        
        # Support pagination with offset and limit
        limit = self.request.query_params.get('limit', 50)
        offset = self.request.query_params.get('offset', 0)
        after_id = self.request.query_params.get('after_id')
        
        try:
            limit = int(limit)
            offset = int(offset)
        except ValueError:
            limit = 50
            offset = 0
        
        # If after_id is provided, get messages after that ID (for polling)
        if after_id:
            try:
                after_id = int(after_id)
                queryset = queryset.filter(message_id__gt=after_id)
            except ValueError:
                pass
        
        # Order by created_at ascending for pagination, then by message_id for consistency
        queryset = queryset.order_by('created_at', 'message_id')
        
        # Apply offset and limit
        if offset > 0:
            queryset = queryset[offset:offset + limit]
        else:
            queryset = queryset[:limit]
        
        return queryset

    def list(self, request, *args, **kwargs):
        """Custom list method to include pagination metadata"""
        import logging
        from datetime import datetime
        
        room_id = self.kwargs.get('room_pk')
        after_id = self.request.query_params.get('after_id')
        limit = int(self.request.query_params.get('limit', 50))
        offset = int(self.request.query_params.get('offset', 0))
        
        # Log the request
        timestamp = datetime.now().strftime('%H:%M:%S')
        logger = logging.getLogger(__name__)
        logger.info(f"📡 [{timestamp}] 💬 BACKEND: Messages request - room={room_id}, after_id={after_id}, limit={limit}, offset={offset}")
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Get total count for pagination metadata
        total_count = Message.objects.filter(room_id=room_id, is_deleted=False).count()
        
        # Check if there are more messages
        has_more = (offset + len(queryset)) < total_count
        
        # Log the response
        logger.info(f"📡 [{timestamp}] 💬 BACKEND: Messages response - room={room_id}, found={len(queryset)} messages, total={total_count}")
        
        return Response({
            'results': serializer.data,
            'messages': serializer.data,  # For backward compatibility
            'total_count': total_count,
            'has_more': has_more,
            'limit': limit,
            'offset': offset
        })

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
        
        # IMPORTANT: When sender sends a message in a room they're viewing, mark it as read
        # Update sender's joined_at to current message time so their own message doesn't count as unread
        # This ensures the badge count is accurate immediately after sending
        sender_membership = RoomMembership.objects.filter(room_id=room_id, user=request.user).first()
        if sender_membership:
            from django.utils import timezone
            from datetime import timedelta
            # Set joined_at to be slightly after the message timestamp to mark it as read
            message_time = message.created_at
            sender_membership.joined_at = max(timezone.now(), message_time) + timedelta(seconds=1)
            sender_membership.save(update_fields=['joined_at'])
            sender_membership.refresh_from_db()
            
            # Calculate and send updated unread count to SENDER for immediate badge update
            # This ensures badge reflects that the sender has seen their own message
            sender_memberships = RoomMembership.objects.filter(user=request.user).select_related('room')
            sender_total_unread = 0
            for memb in sender_memberships:
                memb.refresh_from_db()  # Ensure latest joined_at
                unread = Message.objects.filter(
                    room=memb.room,
                    created_at__gt=memb.joined_at,
                    is_deleted=False
                ).exclude(sender=request.user).count()
                sender_total_unread += unread
            
            sender_total_unread = max(0, sender_total_unread)
            
            # Send unread_count_updated to sender for immediate badge update
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"📊 Sending unread_count_updated to message SENDER: user_id={request.user.pk}, total_unread={sender_total_unread}, room_id={room_id}")
            send_user_notification(request.user.pk, 'unread_count_updated', {
                'unread_count': sender_total_unread,
                'room_id': room_id,
            })
        
        # Send notifications to room members who aren't currently connected (excluding sender)
        room = Room.objects.get(room_id=room_id)
        for membership in room.memberships.exclude(user=request.user):
            send_user_notification(membership.user.pk, 'new_message_notification', {
                'room_id': room_id,
                'message': message_data,
                'sender': request.user.name,
            })
            
            # Calculate and send updated unread count for real-time badge update
            memberships = RoomMembership.objects.filter(user=membership.user).select_related('room')
            total_unread = 0
            for memb in memberships:
                memb.refresh_from_db()  # Ensure latest joined_at
                unread = Message.objects.filter(
                    room=memb.room,
                    created_at__gt=memb.joined_at,
                    is_deleted=False
                ).exclude(sender=membership.user).count()
                total_unread += unread
            
            total_unread = max(0, total_unread)
            
            send_user_notification(membership.user.pk, 'unread_count_updated', {
                'unread_count': total_unread,
                'room_id': room_id,
            })
        
        out = self.get_serializer(message)
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_object(self):
        """
        Override get_object to handle message lookup properly.
        We need to look up by message_id (pk) and room_pk, but also include
        deleted messages in the lookup since we're deleting it.
        """
        room_pk = self.kwargs.get('room_pk')
        pk = self.kwargs.get('pk')
        
        # Get the message, including deleted ones (we're deleting it, so it might already be soft-deleted)
        try:
            message = Message.objects.get(message_id=pk, room_id=room_pk)
            return message
        except Message.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound(f'Message with id {pk} not found in room {room_pk}')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Soft delete by sender or room admin
        if instance.sender_id != request.user.pk and not RoomMembership.objects.filter(room=instance.room, user=request.user, is_admin=True).exists():
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
        
        # Store message content before deletion for system message
        deleted_message_content = instance.content
        deleted_by_user = request.user
        
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])
        
        # Send real-time notification with message details for system message display
        send_room_notification(instance.room.room_id, 'message_deleted', {
            'message_id': instance.message_id,
            'deleted_by': deleted_by_user.name,
            'deleted_by_id': deleted_by_user.pk,
            'message_content': deleted_message_content,  # For system message display
        })
        
        return Response(status=status.HTTP_204_NO_CONTENT)
