#!/usr/bin/env python3
"""
Script to check notifications in the database directly.
This is useful for debugging notification issues.

Usage:
    python check_notifications.py

Requirements:
    - Django environment set up
    - Database accessible
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from backend.apps.ai_api.models import Notification
from backend.apps.users.models import User
from django.contrib.contenttypes.models import ContentType

def check_recent_notifications(hours=24):
    """Check notifications created in the last N hours"""
    print(f"🔍 Checking notifications from the last {hours} hours...")
    print("=" * 60)
    
    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    notifications = Notification.objects.filter(
        created_at__gte=cutoff_time
    ).order_by('-created_at')
    
    if not notifications.exists():
        print("❌ No notifications found in the specified time period.")
        return
    
    print(f"📊 Found {notifications.count()} notifications:")
    print()
    
    for notification in notifications:
        print(f"🔔 Notification ID: {notification.id}")
        print(f"   Type: {notification.notification_type}")
        print(f"   Title: {notification.title}")
        print(f"   Message: {notification.message}")
        print(f"   Recipient: {notification.recipient.name} ({notification.recipient.email})")
        print(f"   Actor: {notification.actor.name if notification.actor else 'System'}")
        print(f"   Created: {notification.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   Read: {'Yes' if notification.is_read else 'No'}")
        
        if notification.content_object:
            content_type = ContentType.objects.get_for_model(notification.content_object)
            print(f"   Content: {content_type.model} (ID: {notification.content_object.id})")
        
        if notification.action_url:
            print(f"   Action URL: {notification.action_url}")
        
        print("-" * 40)

def check_notifications_by_type():
    """Check notifications grouped by type"""
    print("📊 Notifications by Type:")
    print("=" * 40)
    
    from django.db.models import Count
    
    type_counts = Notification.objects.values('notification_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    for item in type_counts:
        print(f"{item['notification_type']}: {item['count']}")

def check_user_notifications(user_email=None):
    """Check notifications for a specific user"""
    if not user_email:
        user_email = input("Enter user email: ").strip()
    
    try:
        user = User.objects.get(email=user_email)
    except User.DoesNotExist:
        print(f"❌ User with email {user_email} not found.")
        return
    
    notifications = Notification.objects.filter(recipient=user).order_by('-created_at')
    
    print(f"🔔 Notifications for {user.name} ({user.email}):")
    print("=" * 50)
    
    if not notifications.exists():
        print("❌ No notifications found for this user.")
        return
    
    print(f"📊 Total notifications: {notifications.count()}")
    print(f"📊 Unread notifications: {notifications.filter(is_read=False).count()}")
    print()
    
    for notification in notifications[:10]:  # Show last 10
        status = "🔴" if not notification.is_read else "✅"
        print(f"{status} {notification.notification_type}: {notification.title}")
        print(f"   {notification.message}")
        print(f"   {notification.created_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print()

def check_database_connection():
    """Check if database connection is working"""
    print("🔌 Testing database connection...")
    
    try:
        user_count = User.objects.count()
        notification_count = Notification.objects.count()
        
        print(f"✅ Database connection successful!")
        print(f"   Users in database: {user_count}")
        print(f"   Total notifications: {notification_count}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def main():
    """Main function"""
    print("🔍 AI API Notification Database Checker")
    print("=" * 50)
    print()
    
    # Check database connection
    if not check_database_connection():
        sys.exit(1)
    
    print()
    
    while True:
        print("Choose an option:")
        print("1. Check recent notifications (last 24 hours)")
        print("2. Check notifications by type")
        print("3. Check notifications for specific user")
        print("4. Check recent notifications (last 1 hour)")
        print("5. Exit")
        
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == "1":
            check_recent_notifications(24)
        elif choice == "2":
            check_notifications_by_type()
        elif choice == "3":
            check_user_notifications()
        elif choice == "4":
            check_recent_notifications(1)
        elif choice == "5":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")
        
        print("\n" + "=" * 50 + "\n")

if __name__ == "__main__":
    main()
