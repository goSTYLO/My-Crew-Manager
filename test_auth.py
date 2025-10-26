#!/usr/bin/env python3
"""
Simple script to test authentication endpoints.
This helps verify the correct endpoints and authentication format.
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def test_login():
    """Test the login endpoint"""
    print("🔐 Testing Authentication Endpoints")
    print("=" * 40)
    
    # Test login endpoint
    print("Testing login endpoint...")
    url = f"{BASE_URL}/api/user/login/"
    
    # You'll need to replace these with real credentials
    email = input("Enter email: ").strip()
    password = input("Enter password: ").strip()
    
    data = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful!")
            print(f"Response: {json.dumps(result, indent=2)}")
            
            # Test user info endpoint
            token = result.get("token")
            if token:
                print(f"\nTesting user info endpoint with token: {token[:20]}...")
                user_url = f"{BASE_URL}/api/user/me/"
                headers = {
                    "Authorization": f"Token {token}"
                }
                
                user_response = requests.get(user_url, headers=headers)
                print(f"User info status: {user_response.status_code}")
                
                if user_response.status_code == 200:
                    user_info = user_response.json()
                    print("✅ User info retrieved!")
                    print(f"User info: {json.dumps(user_info, indent=2)}")
                else:
                    print(f"❌ User info failed: {user_response.text}")
            
        else:
            print(f"❌ Login failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login()
