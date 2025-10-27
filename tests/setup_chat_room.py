#!/usr/bin/env python3
"""
Setup script to ensure chat room 8 exists and users are members
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.chat.models import Room, RoomMembership
from apps.users.models import User

def setup_chat_room():
    print("🔧 Setting up chat room 8 for WebSocket testing...")
    
    # Get the test users
    try:
        user1 = User.objects.get(email="adminaaron@gmail.com")
        user2 = User.objects.get(email="wow@gmail.com")
        print(f"✅ Found users: {user1.name} (ID: {user1.user_id}), {user2.name} (ID: {user2.user_id})")
    except User.DoesNotExist as e:
        print(f"❌ Error finding users: {e}")
        return False
    
    # Create or get room 8
    room, created = Room.objects.get_or_create(
        room_id="8",
        defaults={
            'name': 'Test Room 8',
            'description': 'Test room for WebSocket testing',
            'room_type': 'group',
            'created_by': user1
        }
    )
    
    if created:
        print(f"✅ Created room 8: {room.name}")
    else:
        print(f"✅ Found existing room 8: {room.name}")
    
    # Add users to room 8
    for user in [user1, user2]:
        membership, created = RoomMembership.objects.get_or_create(
            room=room,
            user=user,
            defaults={
                'role': 'member',
                'joined_at': django.utils.timezone.now()
            }
        )
        
        if created:
            print(f"✅ Added {user.name} to room 8")
        else:
            print(f"✅ {user.name} already a member of room 8")
    
    # List all rooms and their members
    print("\n📋 All chat rooms:")
    for room in Room.objects.all():
        members = RoomMembership.objects.filter(room=room)
        print(f"  Room {room.room_id}: {room.name} ({members.count()} members)")
        for member in members:
            print(f"    - {member.user.name}")
    
    return True

if __name__ == "__main__":
    setup_chat_room()
