#!/usr/bin/env python3
"""
Simple WebSocket debugging script
"""

import asyncio
import json
import websockets
import requests

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
CHAT_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/8/"
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/notifications/"
PROJECT_UPDATES_WEBSOCKET_URL = "ws://localhost:8000/ws/project-updates/"

async def test_websocket_with_auth():
    print("🔍 Testing WebSocket Authentication...")
    
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
    
    # Step 2: Test each WebSocket endpoint
    endpoints = [
        ("Chat", f"{CHAT_WEBSOCKET_URL}?token={token}"),
        ("Notification", f"{NOTIFICATION_WEBSOCKET_URL}?token={token}"),
        ("Project Updates", f"{PROJECT_UPDATES_WEBSOCKET_URL}?token={token}")
    ]
    
    for name, url in endpoints:
        print(f"\n2. Testing {name} WebSocket...")
        print(f"URL: {url}")
        
        try:
            websocket = await websockets.connect(url)
            print(f"✅ {name} WebSocket connected successfully!")
            
            # Try to receive a message
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(message)
                print(f"📨 Received: {data}")
            except asyncio.TimeoutError:
                print(f"⏰ No message received within 5 seconds")
            except Exception as e:
                print(f"❌ Error receiving message: {e}")
            
            await websocket.close()
            print(f"🔌 {name} WebSocket closed")
            
        except Exception as e:
            print(f"❌ {name} WebSocket failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_with_auth())
