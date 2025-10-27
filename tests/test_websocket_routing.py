#!/usr/bin/env python3
"""
Test WebSocket routing patterns
"""

import asyncio
import json
import websockets
import requests

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"

async def test_websocket_routing():
    print("🔍 Testing WebSocket Routing Patterns...")
    
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
    
    # Step 2: Test different WebSocket patterns
    patterns = [
        ("Chat Room 8", f"ws://localhost:8000/ws/chat/8/?token={token}"),
        ("Chat Room 9", f"ws://localhost:8000/ws/chat/9/?token={token}"),
        ("Chat Notifications", f"ws://localhost:8000/ws/chat/notifications/?token={token}"),
        ("Project Updates", f"ws://localhost:8000/ws/project-updates/?token={token}"),
    ]
    
    for name, url in patterns:
        print(f"\n2. Testing {name}...")
        print(f"URL: {url}")
        
        try:
            websocket = await websockets.connect(url)
            print(f"✅ {name} connected successfully!")
            
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
            print(f"🔌 {name} closed")
            
        except Exception as e:
            print(f"❌ {name} failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_routing())