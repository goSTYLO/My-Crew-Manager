#!/usr/bin/env python3
"""
Direct WebSocket Test

This script tests WebSocket connections directly to see what's happening.

Usage:
    python tests/test_websocket_direct.py
"""

import asyncio
import websockets
import json
import requests
import sys

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
CHAT_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/8/"
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/notifications/"
PROJECT_UPDATES_WEBSOCKET_URL = "ws://localhost:8000/ws/project-updates/"

def get_token():
    """Get a DRF token for testing"""
    try:
        login_data = {
            "email": "adminaaron@gmail.com",
            "password": "password123"
        }
        
        response = requests.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            return data.get('token')
        return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

async def test_websocket_direct(url, name):
    """Test a WebSocket connection directly"""
    print(f"\n--- Testing {name} ---")
    print(f"URL: {url}")
    
    try:
        websocket = await websockets.connect(url)
        print(f"✅ SUCCESS: {name} connected")
        
        # Wait for any initial message
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
            data = json.loads(message)
            print(f"📨 Received: {data}")
        except asyncio.TimeoutError:
            print("⏰ No initial message received")
        
        await websocket.close()
        print(f"✅ SUCCESS: {name} closed cleanly")
        return True
        
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ ERROR: {name} failed with status {e.status_code}")
        if e.status_code == 404:
            print("   This suggests the WebSocket routing is not working")
        return False
    except Exception as e:
        print(f"❌ ERROR: {name} failed: {e}")
        return False

async def test_websocket_with_token(url, name, token):
    """Test a WebSocket connection with token"""
    print(f"\n--- Testing {name} with Token ---")
    print(f"URL: {url}?token={token[:20]}...")
    
    try:
        ws_url = f"{url}?token={token}"
        websocket = await websockets.connect(ws_url)
        print(f"✅ SUCCESS: {name} connected with token")
        
        # Wait for any initial message
        try:
            message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
            data = json.loads(message)
            print(f"📨 Received: {data}")
        except asyncio.TimeoutError:
            print("⏰ No initial message received")
        
        await websocket.close()
        print(f"✅ SUCCESS: {name} closed cleanly")
        return True
        
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"❌ ERROR: {name} failed with status {e.status_code}")
        if e.status_code == 404:
            print("   This suggests the WebSocket routing is not working")
        elif e.status_code == 401:
            print("   This suggests authentication failed")
        return False
    except Exception as e:
        print(f"❌ ERROR: {name} failed: {e}")
        return False

async def main():
    print("Direct WebSocket Test")
    print("="*50)
    
    # Test without tokens first
    print("\n🔍 Testing WebSocket endpoints without authentication...")
    
    tests = [
        (CHAT_WEBSOCKET_URL, "Chat WebSocket"),
        (NOTIFICATION_WEBSOCKET_URL, "Notification WebSocket"),
        (PROJECT_UPDATES_WEBSOCKET_URL, "Project Updates WebSocket"),
    ]
    
    results = []
    for url, name in tests:
        result = await test_websocket_direct(url, name)
        results.append((name, result))
    
    # Get token and test with authentication
    print("\n🔍 Getting authentication token...")
    token = get_token()
    
    if token:
        print(f"✅ Token obtained: {token[:20]}...")
        
        print("\n🔍 Testing WebSocket endpoints with authentication...")
        for url, name in tests:
            result = await test_websocket_with_token(url, name, token)
            results.append((f"{name} (Auth)", result))
    else:
        print("❌ Could not get authentication token")
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    passed = 0
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} passed")
    
    if passed == 0:
        print("\n❌ All WebSocket tests failed!")
        print("This suggests the WebSocket routing is not working properly.")
        print("The server may need to be restarted after the ASGI configuration change.")
    elif passed < total:
        print("\n⚠️  Some WebSocket tests failed.")
        print("Check the error messages above for specific issues.")
    else:
        print("\n🎉 All WebSocket tests passed!")

if __name__ == "__main__":
    asyncio.run(main())
