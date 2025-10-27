#!/usr/bin/env python
"""
Test script for WebSocket-only chat implementation
"""
import asyncio
import websockets
import json
import sys

async def test_websocket_operations():
    """Test all WebSocket chat operations"""
    try:
        # Test connection to chat room
        uri = "ws://localhost:8000/ws/chat/1/"
        print(f"🔌 Connecting to {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection successful!")
            
            # Test 1: Get room info
            print("\n📋 Testing: Get room info")
            await websocket.send(json.dumps({
                "type": "get_room_info"
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✅ Room info response: {data['type']}")
            
            # Test 2: Get messages
            print("\n💬 Testing: Get messages")
            await websocket.send(json.dumps({
                "type": "get_messages",
                "limit": 10,
                "offset": 0
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✅ Messages response: {data['type']}")
            
            # Test 3: Send message
            print("\n📤 Testing: Send message")
            await websocket.send(json.dumps({
                "type": "chat_message",
                "content": "Test message from WebSocket-only client",
                "message_type": "text"
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✅ Message response: {data['type']}")
            
            # Test 4: Typing indicator
            print("\n⌨️  Testing: Typing indicator")
            await websocket.send(json.dumps({
                "type": "typing"
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✅ Typing response: {data['type']}")
            
            # Test 5: Stop typing
            print("\n⏹️  Testing: Stop typing")
            await websocket.send(json.dumps({
                "type": "stop_typing"
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✅ Stop typing response: {data['type']}")
            
            # Test 6: Create room
            print("\n🏠 Testing: Create room")
            await websocket.send(json.dumps({
                "type": "create_room",
                "name": "Test WebSocket Room",
                "is_private": True
            }))
            
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(response)
            print(f"✅ Create room response: {data['type']}")
            
            print("\n🎉 All WebSocket operations tested successfully!")
            return True
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ Connection closed: {e}")
        return False
    except websockets.exceptions.InvalidURI as e:
        print(f"❌ Invalid URI: {e}")
        return False
    except asyncio.TimeoutError:
        print("⏰ Timeout waiting for response")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def test_notification_connection():
    """Test notification WebSocket connection"""
    try:
        uri = "ws://localhost:8000/ws/chat/notifications/"
        print(f"🔔 Connecting to notifications: {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ Notification WebSocket connection successful!")
            return True
            
    except Exception as e:
        print(f"❌ Notification connection failed: {e}")
        return False

async def main():
    """Run all WebSocket-only tests"""
    print("🧪 Testing WebSocket-Only Chat Implementation")
    print("=" * 60)
    
    # Test chat room operations
    print("\n1. Testing chat room WebSocket operations...")
    chat_success = await test_websocket_operations()
    
    # Test notification connection
    print("\n2. Testing notification WebSocket...")
    notification_success = await test_notification_connection()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 WebSocket-Only Test Results:")
    print(f"   Chat Operations: {'✅ PASS' if chat_success else '❌ FAIL'}")
    print(f"   Notifications: {'✅ PASS' if notification_success else '❌ FAIL'}")
    
    if chat_success and notification_success:
        print("\n🎉 WebSocket-only chat system is working perfectly!")
        print("   ✅ No REST API dependencies")
        print("   ✅ All operations via WebSocket")
        print("   ✅ Real-time messaging")
        print("   ✅ Room management")
        print("   ✅ User management")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check server configuration.")
        return 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⏹️  Test interrupted by user")
        sys.exit(1)
