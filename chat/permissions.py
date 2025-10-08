from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import RoomMembership, Room, Message


class IsAuthenticatedAndRoomMember(BasePermission):
    message = 'You must be a member of the room to perform this action.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return True

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Room):
            room = obj
        elif isinstance(obj, Message):
            room = obj.room
        else:
            return False
        return RoomMembership.objects.filter(room=room, user=request.user).exists()


class IsRoomAdmin(BasePermission):
    message = 'Only room admins can perform this action.'

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Room):
            room = obj
        elif hasattr(obj, 'room'):
            room = obj.room
        else:
            return False
        return RoomMembership.objects.filter(room=room, user=request.user, is_admin=True).exists()


