#!/usr/bin/env python
"""
Simple test script to verify WebSocket chat implementation
"""
import asyncio
import websockets
import json
import sys

async def test_websocket_connection():
    """Test WebSocket connection to chat room"""
    try:
        # Test connection to chat room
        uri = "ws://localhost:8000/ws/chat/1/"
        print(f"Attempting to connect to {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection successful!")
            
            # Send a test message
            test_message = {
                "type": "chat_message",
                "content": "Test message from Python client"
            }
            
            await websocket.send(json.dumps(test_message))
            print("✅ Test message sent successfully!")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                print(f"✅ Received response: {data}")
            except asyncio.TimeoutError:
                print("⚠️  No response received within 5 seconds")
                
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ Connection closed: {e}")
        return False
    except websockets.exceptions.InvalidURI as e:
        print(f"❌ Invalid URI: {e}")
        return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False
    
    return True

async def test_notification_connection():
    """Test WebSocket connection to notifications"""
    try:
        uri = "ws://localhost:8000/ws/chat/notifications/"
        print(f"Attempting to connect to notifications: {uri}")
        
        async with websockets.connect(uri) as websocket:
            print("✅ Notification WebSocket connection successful!")
            return True
            
    except Exception as e:
        print(f"❌ Notification connection failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🧪 Testing WebSocket Chat Implementation")
    print("=" * 50)
    
    # Test chat room connection
    print("\n1. Testing chat room WebSocket...")
    chat_success = await test_websocket_connection()
    
    # Test notification connection
    print("\n2. Testing notification WebSocket...")
    notification_success = await test_notification_connection()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    print(f"   Chat Room WebSocket: {'✅ PASS' if chat_success else '❌ FAIL'}")
    print(f"   Notification WebSocket: {'✅ PASS' if notification_success else '❌ FAIL'}")
    
    if chat_success and notification_success:
        print("\n🎉 All WebSocket tests passed!")
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
