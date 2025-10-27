#!/usr/bin/env python3
"""
WebSocket Broadcasting Test Script

This script specifically tests WebSocket connections and broadcasting functionality
for chat and notifications. It's designed for quick debugging of backend issues.

Usage:
    python tests/test_websocket_broadcasting.py

Requirements:
    - Django server running on localhost:8000
    - Redis server running
    - At least 2 users in the database
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
CHAT_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/1/"
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/notifications/"

class WebSocketBroadcastingTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_tokens = {}
        self.user_ids = {}
        self.websocket_connections = {}
        self.received_messages = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def authenticate_user(self, email, password):
        """Authenticate a single user"""
        try:
            response = self.session.post(f"{DJANGO_BASE_URL}/api/user/login/", json={
                "email": email,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access') or data.get('token')
                user_id = data.get('user_id')
                
                if token and user_id:
                    self.auth_tokens[email] = token
                    self.user_ids[email] = user_id
                    self.log(f"Authenticated {email} (ID: {user_id})", "SUCCESS")
                    return True
                else:
                    self.log(f"Authentication failed for {email}: No token or user_id", "ERROR")
                    return False
            else:
                self.log(f"Authentication failed for {email}: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Authentication error for {email}: {str(e)}", "ERROR")
            return False
    
    async def connect_chat_websocket(self, user_email):
        """Connect to chat WebSocket"""
        if user_email not in self.auth_tokens:
            self.log(f"No token for {user_email}", "ERROR")
            return None
        
        try:
            self.log(f"Connecting to chat WebSocket for {user_email}...")
            websocket = await websockets.connect(CHAT_WEBSOCKET_URL)
            self.websocket_connections[f"chat_{user_email}"] = websocket
            self.log(f"Chat WebSocket connected for {user_email}", "SUCCESS")
            return websocket
        except Exception as e:
            self.log(f"Chat WebSocket connection failed for {user_email}: {str(e)}", "ERROR")
            return None
    
    async def connect_notification_websocket(self, user_email):
        """Connect to notification WebSocket"""
        if user_email not in self.auth_tokens:
            self.log(f"No token for {user_email}", "ERROR")
            return None
        
        try:
            self.log(f"Connecting to notification WebSocket for {user_email}...")
            websocket = await websockets.connect(NOTIFICATION_WEBSOCKET_URL)
            
            # Send authentication
            auth_message = {
                "type": "auth",
                "token": self.auth_tokens[user_email]
            }
            await websocket.send(json.dumps(auth_message))
            
            # Wait for auth response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.log(f"Notification WebSocket auth response for {user_email}: {data.get('type', 'unknown')}", "INFO")
            except asyncio.TimeoutError:
                self.log(f"No auth response for {user_email}", "WARNING")
            
            self.websocket_connections[f"notification_{user_email}"] = websocket
            self.log(f"Notification WebSocket connected for {user_email}", "SUCCESS")
            return websocket
        except Exception as e:
            self.log(f"Notification WebSocket connection failed for {user_email}: {str(e)}", "ERROR")
            return None
    
    def create_test_project(self, user_email):
        """Create a test project"""
        if user_email not in self.auth_tokens:
            self.log(f"No token for {user_email}", "ERROR")
            return None
        
        try:
            headers = {"Authorization": f"Token {self.auth_tokens[user_email]}"}
            project_data = {
                "title": f"WebSocket Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Test project for WebSocket broadcasting"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/projects/", json=project_data, headers=headers)
            
            if response.status_code == 201:
                project = response.json()
                self.log(f"Created project {project['id']} for {user_email}", "SUCCESS")
                return project
            else:
                self.log(f"Failed to create project for {user_email}: {response.status_code}", "ERROR")
                return None
        except Exception as e:
            self.log(f"Error creating project for {user_email}: {str(e)}", "ERROR")
            return None
    
    def add_project_member(self, project_id, owner_email, member_email):
        """Add a member to the project"""
        if owner_email not in self.auth_tokens:
            self.log(f"No token for {owner_email}", "ERROR")
            return False
        
        if member_email not in self.user_ids:
            self.log(f"No user ID for {member_email}", "ERROR")
            return False
        
        try:
            headers = {"Authorization": f"Token {self.auth_tokens[owner_email]}"}
            member_data = {
                "project": project_id,
                "user": self.user_ids[member_email],
                "role": "developer"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/project-members/", json=member_data, headers=headers)
            
            if response.status_code == 201:
                self.log(f"Added {member_email} to project {project_id}", "SUCCESS")
                return True
            else:
                self.log(f"Failed to add {member_email} to project: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Error adding member {member_email}: {str(e)}", "ERROR")
            return False
    
    def update_project(self, project_id, user_email):
        """Update project to trigger broadcasting"""
        if user_email not in self.auth_tokens:
            self.log(f"No token for {user_email}", "ERROR")
            return False
        
        try:
            headers = {"Authorization": f"Token {self.auth_tokens[user_email]}"}
            update_data = {
                "title": f"Updated WebSocket Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Updated test project for WebSocket broadcasting"
            }
            
            response = self.session.put(f"{DJANGO_BASE_URL}/api/ai/projects/{project_id}/", json=update_data, headers=headers)
            
            if response.status_code == 200:
                self.log(f"Updated project {project_id} by {user_email}", "SUCCESS")
                return True
            else:
                self.log(f"Failed to update project: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Error updating project: {str(e)}", "ERROR")
            return False
    
    def send_chat_message(self, user_email, content):
        """Send a chat message"""
        chat_ws = self.websocket_connections.get(f"chat_{user_email}")
        if not chat_ws:
            self.log(f"No chat WebSocket for {user_email}", "ERROR")
            return False
        
        try:
            message = {
                "type": "chat_message",
                "content": content,
                "message_type": "text"
            }
            
            asyncio.create_task(chat_ws.send(json.dumps(message)))
            self.log(f"Sent chat message from {user_email}: {content}", "SUCCESS")
            return True
        except Exception as e:
            self.log(f"Error sending chat message from {user_email}: {str(e)}", "ERROR")
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
        print("📊 WEBSOCKET BROADCASTING TEST SUMMARY")
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
    print("🚀 WebSocket Broadcasting Test")
    print("="*50)
    
    tester = WebSocketBroadcastingTester()
    
    try:
        # Step 1: Authenticate users using known tokens
        print("\n🔐 Step 1: Authenticating users...")
        
        # Use known tokens from test_notifications.py
        user1_email = "adminaaron@gmail.com"
        user1_password = "admin123"  # You may need to adjust this
        
        if not tester.authenticate_user(user1_email, user1_password):
            print("❌ Failed to authenticate first user, trying with token directly...")
            # If password doesn't work, we'll use the token directly
            tester.auth_tokens[user1_email] = "039158d9bb4842081e9c5fe29bb72944dec0a62b"
            tester.user_ids[user1_email] = 14  # From test_notifications.py
            print("✅ Using token directly for user 1")
        
        user2_email = "wow@gmail.com"
        user2_password = "wow123"  # You may need to adjust this
        
        if not tester.authenticate_user(user2_email, user2_password):
            print("❌ Failed to authenticate second user, trying with token directly...")
            # If password doesn't work, we'll use the token directly
            tester.auth_tokens[user2_email] = "b3c1a6e61db69898a7c6e3b6eb0d0a982fcd6317"
            tester.user_ids[user2_email] = 19  # From test_notifications.py
            print("✅ Using token directly for user 2")
        
        # Step 2: Connect WebSockets
        print("\n🔌 Step 2: Connecting WebSockets...")
        await tester.connect_chat_websocket(user1_email)
        await tester.connect_chat_websocket(user2_email)
        await tester.connect_notification_websocket(user1_email)
        await tester.connect_notification_websocket(user2_email)
        
        # Step 3: Create project and add members
        print("\n📋 Step 3: Creating project and adding members...")
        project = tester.create_test_project(user1_email)
        if project:
            tester.add_project_member(project['id'], user1_email, user2_email)
        
        # Step 4: Start listening for messages
        print("\n👂 Step 4: Starting message listener...")
        listener_task = asyncio.create_task(tester.listen_for_messages(duration=20))
        
        # Step 5: Trigger events
        print("\n⚡ Step 5: Triggering events...")
        
        # Wait a moment for listener to start
        await asyncio.sleep(2)
        
        # Send chat messages
        tester.send_chat_message(user1_email, "Hello from user 1!")
        await asyncio.sleep(1)
        tester.send_chat_message(user2_email, "Hello from user 2!")
        await asyncio.sleep(1)
        
        # Update project to trigger notifications
        if project:
            tester.update_project(project['id'], user1_email)
            await asyncio.sleep(2)
            tester.update_project(project['id'], user2_email)
        
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
    print("🔍 WebSocket Broadcasting Test Script")
    print("="*50)
    print("This script tests:")
    print("  ✅ WebSocket connections (chat & notifications)")
    print("  ✅ Real-time message broadcasting")
    print("  ✅ Project update notifications")
    print("  ✅ Chat message broadcasting")
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
    
    print("\n🚀 Starting WebSocket broadcasting test...")
    asyncio.run(main())
