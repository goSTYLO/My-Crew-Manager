from django.contrib import admin
from .models import Room, RoomMembership, Message

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_id', 'name', 'is_private', 'created_by', 'created_at']
    list_filter = ['is_private', 'created_at', 'created_by']
    search_fields = ['name', 'created_by__name', 'created_by__email']
    date_hierarchy = 'created_at'

@admin.register(RoomMembership)
class RoomMembershipAdmin(admin.ModelAdmin):
    list_display = ['membership_id', 'room', 'user', 'is_admin', 'joined_at']
    list_filter = ['is_admin', 'joined_at', 'room']
    search_fields = ['room__name', 'user__name', 'user__email']
    date_hierarchy = 'joined_at'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['message_id', 'room', 'sender', 'message_type', 'created_at', 'is_deleted']
    list_filter = ['message_type', 'is_deleted', 'created_at', 'room']
    search_fields = ['content', 'sender__name', 'sender__email', 'room__name']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'edited_at']
