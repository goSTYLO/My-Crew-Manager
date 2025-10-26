#!/usr/bin/env python3
"""
Setup script to help configure the notification test script.
This script will help you get JWT tokens and user IDs for testing.

Usage:
    python tests/setup_test_data.py

Requirements:
    - Django server running on localhost:8000
    - At least 2 users in the database
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/ai"

def get_auth_token(email, password):
    """Get authentication token for a user"""
    url = f"{BASE_URL}/api/user/login/"
    data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            return response.json().get("token")
        else:
            print(f"❌ Login failed for {email}: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error logging in {email}: {e}")
        return None

def get_user_info(token):
    """Get user info using authentication token"""
    url = f"{BASE_URL}/api/user/me/"
    headers = {
        "Authorization": f"Token {token}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Failed to get user info: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting user info: {e}")
        return None

def main():
    """Main setup function"""
    print("🔧 AI API Notification Test Setup")
    print("=" * 50)
    print()
    print("This script will help you get JWT tokens and user IDs for testing.")
    print("You'll need credentials for at least 2 users.")
    print()
    
    # Get user credentials
    users = []
    for i in range(2):
        print(f"👤 User {i+1}:")
        email = input("  Email: ").strip()
        password = input("  Password: ").strip()
        users.append({"email": email, "password": password})
        print()
    
    print("🔑 Getting JWT tokens...")
    print("-" * 30)
    
    user_data = []
    for i, user in enumerate(users):
        print(f"Getting token for {user['email']}...")
        token = get_auth_token(user["email"], user["password"])
        
        if token:
            print(f"✅ Token obtained for {user['email']}")
            user_info = get_user_info(token)
            if user_info:
                user_data.append({
                    "email": user["email"],
                    "token": token,
                    "user_id": user_info.get("user_id"),
                    "name": user_info.get("name")
                })
                print(f"   User ID: {user_info.get('user_id')}")
                print(f"   Name: {user_info.get('name')}")
            else:
                print(f"❌ Failed to get user info for {user['email']}")
        else:
            print(f"❌ Failed to get token for {user['email']}")
        print()
    
    if len(user_data) < 2:
        print("❌ Need at least 2 users with valid tokens to run tests.")
        sys.exit(1)
    
    # Generate test configuration
    print("📝 Generated Test Configuration:")
    print("=" * 50)
    print()
    print("Copy this configuration into tests/test_notifications.py:")
    print()
    print("TEST_CONFIG = {")
    print(f'    "user1_token": "{user_data[0]["token"]}",  # {user_data[0]["email"]}')
    print(f'    "user2_token": "{user_data[1]["token"]}",  # {user_data[1]["email"]}')
    print(f'    "user1_id": {user_data[0]["user_id"]},  # {user_data[0]["name"]}')
    print(f'    "user2_id": {user_data[1]["user_id"]},  # {user_data[1]["name"]}')
    print('    "project_id": None,  # Will be set after project creation')
    print('    "epic_id": None,  # Will be set after epic creation')
    print('    "sub_epic_id": None,  # Will be set after sub-epic creation')
    print('    "user_story_id": None,  # Will be set after user story creation')
    print('    "task_id": None,  # Will be set after task creation')
    print('    "repository_id": None,  # Will be set after repository creation')
    print("}")
    print()
    print("✅ Setup complete! Now you can run: python tests/test_notifications.py")

if __name__ == "__main__":
    main()
