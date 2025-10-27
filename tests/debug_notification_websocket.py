#!/usr/bin/env python3
"""
Debug notification WebSocket specifically
"""

import asyncio
import json
import websockets
import requests

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/notifications/"

async def test_notification_websocket():
    print("🔍 Testing Notification WebSocket specifically...")
    
    # Step 1: Login and get token
    print("\n1. Logging in...")
    login_data = {
        "email": "adminaaron@gmail.com",
        "password": "password123"
    }
    
    response = requests.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
    print(f"Login status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        return
    
    data = response.json()
    token = data.get('token')
    print(f"Token: {token[:20]}...")
    print(f"User ID: {data.get('id')}")
    
    # Step 2: Test notification WebSocket with detailed error handling
    print(f"\n2. Testing Notification WebSocket...")
    url = f"{NOTIFICATION_WEBSOCKET_URL}?token={token}"
    print(f"URL: {url}")
    
    try:
        print("Attempting to connect...")
        websocket = await websockets.connect(url)
        print("✅ Notification WebSocket connected successfully!")
        
        # Try to receive a message
        try:
            print("Waiting for message...")
            message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            data = json.loads(message)
            print(f"📨 Received: {data}")
        except asyncio.TimeoutError:
            print(f"⏰ No message received within 10 seconds")
        except Exception as e:
            print(f"❌ Error receiving message: {e}")
        
        await websocket.close()
        print("🔌 Notification WebSocket closed")
        
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ WebSocket connection failed with status {e.status_code}")
        print(f"Response headers: {e.response_headers}")
        if e.response_headers.get('content-type', '').startswith('text/'):
            print(f"Response body: {e.response_body}")
    except Exception as e:
        print(f"❌ Notification WebSocket failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_notification_websocket())
