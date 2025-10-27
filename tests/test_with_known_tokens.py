#!/usr/bin/env python3
"""
Test Script with Known Tokens

This script uses the known tokens from test_notifications.py to test
WebSocket functionality without requiring user input.

Usage:
    python tests/test_with_known_tokens.py

Requirements:
    - Django server running on localhost:8000
    - Redis server running
"""

import asyncio
import websockets
import json
import requests
import time
import sys
from datetime import datetime

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
CHAT_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/8/"
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/notifications/"

# Known tokens from test_notifications.py
KNOWN_TOKENS = {
    "adminaaron@gmail.com": {
        "token": "039158d9bb4842081e9c5fe29bb72944dec0a62b",
        "user_id": 14,
        "name": "Aaron Tamayo"
    },
    "wow@gmail.com": {
        "token": "b3c1a6e61db69898a7c6e3b6eb0d0a982fcd6317",
        "user_id": 19,
        "name": "WOWOW WOWOW"
    }
}

class KnownTokenTester:
    def __init__(self):
        self.session = requests.Session()
        self.websocket_connections = {}
        self.received_messages = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_django_server(self):
        """Test if Django server is running"""
        try:
            response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/", timeout=5)
            if response.status_code == 200:
                self.log("Django server is running", "SUCCESS")
                return True
            else:
                self.log(f"Django server returned status: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Django server error: {str(e)}", "ERROR")
            return False
    
    def test_api_with_tokens(self):
        """Test API endpoints with known tokens"""
        for email, user_data in KNOWN_TOKENS.items():
            try:
                headers = {"Authorization": f"Token {user_data['token']}"}
                
                # Test notifications API
                response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/notifications/", headers=headers)
                if response.status_code == 200:
                    notifications = response.json()
                    self.log(f"✅ {email}: Retrieved {len(notifications)} notifications", "SUCCESS")
                else:
                    self.log(f"❌ {email}: Notifications API failed - {response.status_code}", "ERROR")
                
                # Test chat API
                response = self.session.get(f"{DJANGO_BASE_URL}/api/chat/rooms/", headers=headers)
                if response.status_code == 200:
                    rooms = response.json()
                    self.log(f"✅ {email}: Retrieved {len(rooms)} chat rooms", "SUCCESS")
                else:
                    self.log(f"❌ {email}: Chat API failed - {response.status_code}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ {email}: API test error - {str(e)}", "ERROR")
    
    async def test_chat_websocket(self, email):
        """Test chat WebSocket connection"""
        try:
            self.log(f"Connecting to chat WebSocket for {email}...")
            websocket = await websockets.connect(CHAT_WEBSOCKET_URL)
            self.websocket_connections[f"chat_{email}"] = websocket
            
            # Send a test message
            test_message = {
                "type": "chat_message",
                "content": f"Test message from {email}",
                "message_type": "text"
            }
            await websocket.send(json.dumps(test_message))
            self.log(f"✅ {email}: Chat WebSocket connected and message sent", "SUCCESS")
            
            return websocket
        except Exception as e:
            self.log(f"❌ {email}: Chat WebSocket failed - {str(e)}", "ERROR")
            return None
    
    async def test_notification_websocket(self, email):
        """Test notification WebSocket connection"""
        try:
            self.log(f"Connecting to notification WebSocket for {email}...")
            websocket = await websockets.connect(NOTIFICATION_WEBSOCKET_URL)
            
            # Send authentication
            auth_message = {
                "type": "auth",
                "token": KNOWN_TOKENS[email]["token"]
            }
            await websocket.send(json.dumps(auth_message))
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.log(f"✅ {email}: Notification WebSocket connected - {data.get('type', 'unknown')}", "SUCCESS")
            except asyncio.TimeoutError:
                self.log(f"⚠️ {email}: No auth response received", "WARNING")
            
            self.websocket_connections[f"notification_{email}"] = websocket
            return websocket
        except Exception as e:
            self.log(f"❌ {email}: Notification WebSocket failed - {str(e)}", "ERROR")
            return None
    
    def create_test_project(self, email):
        """Create a test project"""
        try:
            headers = {"Authorization": f"Token {KNOWN_TOKENS[email]['token']}"}
            project_data = {
                "title": f"WebSocket Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Test project for WebSocket testing"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/projects/", json=project_data, headers=headers)
            if response.status_code == 201:
                project = response.json()
                self.log(f"✅ {email}: Created project {project['id']}", "SUCCESS")
                return project
            else:
                self.log(f"❌ {email}: Project creation failed - {response.status_code}", "ERROR")
                return None
        except Exception as e:
            self.log(f"❌ {email}: Project creation error - {str(e)}", "ERROR")
            return None
    
    def add_project_member(self, project_id, owner_email, member_email):
        """Add a member to the project"""
        try:
            headers = {"Authorization": f"Token {KNOWN_TOKENS[owner_email]['token']}"}
            member_data = {
                "project": project_id,
                "user": KNOWN_TOKENS[member_email]["user_id"],
                "role": "developer"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/project-members/", json=member_data, headers=headers)
            if response.status_code == 201:
                self.log(f"✅ Added {member_email} to project {project_id}", "SUCCESS")
                return True
            else:
                self.log(f"❌ Failed to add {member_email} to project - {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error adding member {member_email} - {str(e)}", "ERROR")
            return False
    
    def update_project(self, project_id, email):
        """Update project to trigger broadcasting"""
        try:
            headers = {"Authorization": f"Token {KNOWN_TOKENS[email]['token']}"}
            update_data = {
                "title": f"Updated WebSocket Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Updated test project for WebSocket broadcasting"
            }
            
            response = self.session.put(f"{DJANGO_BASE_URL}/api/ai/projects/{project_id}/", json=update_data, headers=headers)
            if response.status_code == 200:
                self.log(f"✅ {email}: Updated project {project_id}", "SUCCESS")
                return True
            else:
                self.log(f"❌ {email}: Project update failed - {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ {email}: Project update error - {str(e)}", "ERROR")
            return False
    
    async def listen_for_messages(self, duration=10):
        """Listen for WebSocket messages"""
        self.log(f"Listening for messages for {duration} seconds...")
        
        async def listen_connection(websocket, conn_name):
            try:
                while True:
                    message = await websocket.recv()
                    data = json.loads(message)
                    self.received_messages.append((conn_name, data))
                    self.log(f"📨 {conn_name}: {data.get('type', 'unknown')} - {json.dumps(data, indent=2)}", "MESSAGE")
            except websockets.exceptions.ConnectionClosed:
                self.log(f"🔌 {conn_name}: Connection closed", "INFO")
            except Exception as e:
                self.log(f"❌ {conn_name}: Error - {str(e)}", "ERROR")
        
        # Start listening tasks
        tasks = []
        for conn_name, websocket in self.websocket_connections.items():
            tasks.append(listen_connection(websocket, conn_name))
        
        # Run for specified duration
        try:
            await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=True), timeout=duration)
        except asyncio.TimeoutError:
            self.log(f"Finished listening after {duration} seconds", "INFO")
    
    async def cleanup(self):
        """Clean up WebSocket connections"""
        self.log("Cleaning up WebSocket connections...")
        
        for conn_name, websocket in self.websocket_connections.items():
            try:
                await websocket.close()
                self.log(f"Closed {conn_name}", "SUCCESS")
            except Exception as e:
                self.log(f"Error closing {conn_name}: {str(e)}", "ERROR")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 WEBSOCKET TEST SUMMARY")
        print("="*60)
        
        print(f"WebSocket Connections: {len(self.websocket_connections)}")
        print(f"Messages Received: {len(self.received_messages)}")
        
        if self.received_messages:
            print("\n📨 Received Messages:")
            for conn_name, data in self.received_messages:
                print(f"  - {conn_name}: {data.get('type', 'unknown')}")
        
        print("="*60)

async def main():
    """Main test function"""
    print("🚀 WebSocket Test with Known Tokens")
    print("="*50)
    
    tester = KnownTokenTester()
    
    try:
        # Step 1: Test Django server
        if not tester.test_django_server():
            print("❌ Django server is not running. Please start it first.")
            return
        
        # Step 2: Test API with known tokens
        print("\n🔐 Step 2: Testing API with known tokens...")
        tester.test_api_with_tokens()
        
        # Step 3: Connect WebSockets
        print("\n🔌 Step 3: Connecting WebSockets...")
        for email in KNOWN_TOKENS.keys():
            await tester.test_chat_websocket(email)
            await tester.test_notification_websocket(email)
        
        # Step 4: Create project and add members
        print("\n📋 Step 4: Creating project and adding members...")
        emails = list(KNOWN_TOKENS.keys())
        project = tester.create_test_project(emails[0])
        if project:
            tester.add_project_member(project['id'], emails[0], emails[1])
        
        # Step 5: Start listening for messages
        print("\n👂 Step 5: Starting message listener...")
        listener_task = asyncio.create_task(tester.listen_for_messages(duration=15))
        
        # Step 6: Trigger events
        print("\n⚡ Step 6: Triggering events...")
        
        # Wait a moment for listener to start
        await asyncio.sleep(2)
        
        # Update project to trigger notifications
        if project:
            tester.update_project(project['id'], emails[0])
            await asyncio.sleep(2)
            tester.update_project(project['id'], emails[1])
        
        # Wait for listener to finish
        await listener_task
        
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Critical error: {str(e)}")
    finally:
        await tester.cleanup()
        tester.print_summary()

if __name__ == "__main__":
    print("🔍 WebSocket Test with Known Tokens")
    print("="*50)
    print("This script uses known tokens to test:")
    print("  ✅ Django server connectivity")
    print("  ✅ API endpoints with authentication")
    print("  ✅ WebSocket connections (chat & notifications)")
    print("  ✅ Project creation and broadcasting")
    print("  ✅ Real-time message listening")
    print("="*50)
    print()
    
    # Check Django server
    try:
        response = requests.get(f"{DJANGO_BASE_URL}/api/ai/", timeout=3)
        if response.status_code == 200:
            print("✅ Django server is running")
        else:
            print("❌ Django server is not responding properly")
            sys.exit(1)
    except:
        print("❌ Django server is not running. Please start it first.")
        sys.exit(1)
    
    print("\n🚀 Starting WebSocket test with known tokens...")
    asyncio.run(main())
