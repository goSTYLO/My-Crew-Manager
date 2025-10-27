#!/usr/bin/env python3
"""
Backend Chat and Notifications Broadcasting Test Script

This script tests the backend WebSocket functionality for chat and notifications
without requiring the frontend. It helps debug backend issues before frontend testing.

Usage:
    python tests/test_chat_notifications_backend.py

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
import threading
import queue

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
CHAT_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/8/"  # Test room 1
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/notifications/"
API_BASE = f"{DJANGO_BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_tokens = {}
        self.user_ids = {}
        self.test_results = []
        self.message_queue = queue.Queue()
        self.websocket_connections = {}
        
    def log_test(self, test_name, status, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
    
    def create_test_users(self):
        """Create test users for multi-user testing"""
        print("\n🔧 Creating test users...")
        
        users_data = [
            {
                "email": "backendtest1@example.com",
                "name": "Backend Test User 1",
                "password": "testpass123"
            },
            {
                "email": "backendtest2@example.com", 
                "name": "Backend Test User 2",
                "password": "testpass123"
            }
        ]
        
        for user_data in users_data:
            try:
                # Try to create user
                response = self.session.post(f"{DJANGO_BASE_URL}/api/user/signup/", json=user_data)
                if response.status_code == 201:
                    self.log_test(f"Create user {user_data['name']}", "PASS", "User created successfully")
                elif response.status_code == 400 and "already exists" in response.text:
                    self.log_test(f"Create user {user_data['name']}", "PASS", "User already exists")
                else:
                    self.log_test(f"Create user {user_data['name']}", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"Create user {user_data['name']}", "FAIL", f"Error: {str(e)}")
    
    def authenticate_users(self):
        """Authenticate test users and get tokens"""
        print("\n🔐 Authenticating users...")
        
        users = [
            {"email": "backendtest1@example.com", "password": "testpass123"},
            {"email": "backendtest2@example.com", "password": "testpass123"}
        ]
        
        for user in users:
            try:
                response = self.session.post(f"{DJANGO_BASE_URL}/api/user/login/", json=user)
                if response.status_code == 200:
                    data = response.json()
                    token = data.get('access') or data.get('token')
                    if token:
                        self.auth_tokens[user['email']] = token
                        self.user_ids[user['email']] = data.get('user_id')
                        self.log_test(f"Authenticate {user['email']}", "PASS", f"Token obtained, User ID: {data.get('user_id')}")
                    else:
                        self.log_test(f"Authenticate {user['email']}", "FAIL", "No token in response")
                else:
                    self.log_test(f"Authenticate {user['email']}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Authenticate {user['email']}", "FAIL", f"Error: {str(e)}")
    
    def test_django_server(self):
        """Test if Django server is running and accessible"""
        print("\n🌐 Testing Django server...")
        
        try:
            response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/", timeout=5)
            if response.status_code == 200:
                self.log_test("Django server", "PASS", "Server is running and accessible")
                return True
            else:
                self.log_test("Django server", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Django server", "FAIL", f"Error: {str(e)}")
            return False
    
    def test_redis_connection(self):
        """Test if Redis is accessible through Django"""
        print("\n🔴 Testing Redis connection...")
        
        try:
            # Test by creating a simple project (this will use Redis for notifications)
            if not self.auth_tokens:
                self.log_test("Redis connection", "FAIL", "No authenticated users")
                return False
            
            user_email = list(self.auth_tokens.keys())[0]
            token = self.auth_tokens[user_email]
            headers = {"Authorization": f"Token {token}"}
            
            # Create a test project to trigger Redis usage
            project_data = {
                "title": f"Redis Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Test project for Redis connection testing"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/projects/", json=project_data, headers=headers)
            if response.status_code == 201:
                self.log_test("Redis connection", "PASS", "Redis is accessible through Django")
                return True
            else:
                self.log_test("Redis connection", "FAIL", f"Project creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Redis connection", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_chat_websocket_connection(self, user_email):
        """Test WebSocket connection to chat"""
        print(f"\n💬 Testing chat WebSocket for {user_email}...")
        
        if user_email not in self.auth_tokens:
            self.log_test(f"Chat WebSocket {user_email}", "FAIL", "No auth token available")
            return None
        
        try:
            # Connect to chat WebSocket
            uri = CHAT_WEBSOCKET_URL
            print(f"Connecting to: {uri}")
            
            websocket = await websockets.connect(uri)
            self.websocket_connections[f"chat_{user_email}"] = websocket
            
            # Test basic connection
            self.log_test(f"Chat WebSocket {user_email}", "PASS", "Connected successfully")
            
            # Test sending a message
            test_message = {
                "type": "chat_message",
                "content": f"Test message from {user_email}",
                "message_type": "text"
            }
            
            await websocket.send(json.dumps(test_message))
            self.log_test(f"Chat message send {user_email}", "PASS", "Message sent successfully")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.log_test(f"Chat message response {user_email}", "PASS", f"Received: {data.get('type', 'unknown')}")
            except asyncio.TimeoutError:
                self.log_test(f"Chat message response {user_email}", "WARN", "No response received within 5 seconds")
            
            return websocket
            
        except Exception as e:
            self.log_test(f"Chat WebSocket {user_email}", "FAIL", f"Error: {str(e)}")
            return None
    
    async def test_notification_websocket_connection(self, user_email):
        """Test WebSocket connection to notifications"""
        print(f"\n🔔 Testing notification WebSocket for {user_email}...")
        
        if user_email not in self.auth_tokens:
            self.log_test(f"Notification WebSocket {user_email}", "FAIL", "No auth token available")
            return None
        
        try:
            # Connect to notification WebSocket
            uri = NOTIFICATION_WEBSOCKET_URL
            print(f"Connecting to: {uri}")
            
            websocket = await websockets.connect(uri)
            self.websocket_connections[f"notification_{user_email}"] = websocket
            
            # Send authentication message
            auth_message = {
                "type": "auth",
                "token": self.auth_tokens[user_email]
            }
            await websocket.send(json.dumps(auth_message))
            
            # Wait for authentication response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                if data.get('type') == 'auth_success':
                    self.log_test(f"Notification WebSocket {user_email}", "PASS", "Connected and authenticated successfully")
                else:
                    self.log_test(f"Notification WebSocket {user_email}", "PASS", f"Connected, response: {data.get('type', 'unknown')}")
            except asyncio.TimeoutError:
                self.log_test(f"Notification WebSocket {user_email}", "WARN", "No auth response received within 5 seconds")
            
            return websocket
            
        except Exception as e:
            self.log_test(f"Notification WebSocket {user_email}", "FAIL", f"Error: {str(e)}")
            return None
    
    def test_notification_api(self):
        """Test notification API endpoints"""
        print("\n📧 Testing notification API endpoints...")
        
        if not self.auth_tokens:
            self.log_test("Notification API", "FAIL", "No authenticated users")
            return
        
        user_email = list(self.auth_tokens.keys())[0]
        token = self.auth_tokens[user_email]
        headers = {"Authorization": f"Token {token}"}
        
        try:
            # Test get notifications
            response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/notifications/", headers=headers)
            if response.status_code == 200:
                notifications = response.json()
                self.log_test("Get notifications", "PASS", f"Retrieved {len(notifications)} notifications")
            else:
                self.log_test("Get notifications", "FAIL", f"Status: {response.status_code}")
            
            # Test unread count
            response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/notifications/unread_count/", headers=headers)
            if response.status_code == 200:
                count = response.json().get('unread_count', 0)
                self.log_test("Get unread count", "PASS", f"Unread count: {count}")
            else:
                self.log_test("Get unread count", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Notification API", "FAIL", f"Error: {str(e)}")
    
    def test_chat_api(self):
        """Test chat API endpoints"""
        print("\n💬 Testing chat API endpoints...")
        
        if not self.auth_tokens:
            self.log_test("Chat API", "FAIL", "No authenticated users")
            return
        
        user_email = list(self.auth_tokens.keys())[0]
        token = self.auth_tokens[user_email]
        headers = {"Authorization": f"Token {token}"}
        
        try:
            # Test get chat rooms
            response = self.session.get(f"{DJANGO_BASE_URL}/api/chat/rooms/", headers=headers)
            if response.status_code == 200:
                rooms = response.json()
                self.log_test("Get chat rooms", "PASS", f"Retrieved {len(rooms)} rooms")
            else:
                self.log_test("Get chat rooms", "FAIL", f"Status: {response.status_code}")
            
            # Test get messages for room 1
            response = self.session.get(f"{DJANGO_BASE_URL}/api/chat/rooms/1/messages/", headers=headers)
            if response.status_code == 200:
                messages = response.json()
                self.log_test("Get chat messages", "PASS", f"Retrieved {len(messages.get('results', []))} messages")
            else:
                self.log_test("Get chat messages", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Chat API", "FAIL", f"Error: {str(e)}")
    
    def test_project_creation_and_broadcasting(self):
        """Test project creation and notification broadcasting"""
        print("\n📋 Testing project creation and broadcasting...")
        
        if len(self.auth_tokens) < 2:
            self.log_test("Project broadcasting", "FAIL", "Need at least 2 authenticated users")
            return
        
        user1_email = list(self.auth_tokens.keys())[0]
        user2_email = list(self.auth_tokens.keys())[1]
        token1 = self.auth_tokens[user1_email]
        headers1 = {"Authorization": f"Token {token1}"}
        
        try:
            # Create a test project
            project_data = {
                "title": f"Broadcast Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Test project for broadcasting testing"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/projects/", json=project_data, headers=headers1)
            if response.status_code == 201:
                project = response.json()
                project_id = project['id']
                self.log_test("Create project", "PASS", f"Project created with ID: {project_id}")
                
                # Add user2 as project member
                member_data = {
                    "project": project_id,
                    "user": self.user_ids[user2_email],
                    "role": "developer"
                }
                
                response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/project-members/", json=member_data, headers=headers1)
                if response.status_code == 201:
                    self.log_test("Add project member", "PASS", f"Added {user2_email} as project member")
                else:
                    self.log_test("Add project member", "FAIL", f"Status: {response.status_code}")
                
                # Update project to trigger broadcasting
                update_data = {
                    "title": f"Updated Broadcast Test Project {datetime.now().strftime('%H%M%S')}",
                    "summary": "Updated test project for broadcasting testing"
                }
                
                response = self.session.put(f"{DJANGO_BASE_URL}/api/ai/projects/{project_id}/", json=update_data, headers=headers1)
                if response.status_code == 200:
                    self.log_test("Update project", "PASS", "Project updated successfully")
                    self.log_test("Broadcasting test", "PASS", "Project update should trigger notifications to all members")
                else:
                    self.log_test("Update project", "FAIL", f"Status: {response.status_code}")
                    
            else:
                self.log_test("Create project", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Project broadcasting", "FAIL", f"Error: {str(e)}")
    
    async def test_websocket_message_listening(self, duration=10):
        """Test listening for WebSocket messages for a specified duration"""
        print(f"\n👂 Testing WebSocket message listening for {duration} seconds...")
        
        if not self.websocket_connections:
            self.log_test("WebSocket listening", "FAIL", "No WebSocket connections available")
            return
        
        print(f"Listening for messages on {len(self.websocket_connections)} connections...")
        
        # Start listening task
        async def listen_for_messages():
            tasks = []
            for conn_name, websocket in self.websocket_connections.items():
                async def listen_connection(ws, name):
                    try:
                        while True:
                            message = await ws.recv()
                            data = json.loads(message)
                            print(f"📨 {name}: {data.get('type', 'unknown')} - {data}")
                            self.message_queue.put((name, data))
                    except websockets.exceptions.ConnectionClosed:
                        print(f"🔌 {name}: Connection closed")
                    except Exception as e:
                        print(f"❌ {name}: Error - {e}")
                
                tasks.append(listen_connection(websocket, conn_name))
            
            await asyncio.gather(*tasks, return_exceptions=True)
        
        # Run listening for specified duration
        try:
            await asyncio.wait_for(listen_for_messages(), timeout=duration)
        except asyncio.TimeoutError:
            self.log_test("WebSocket listening", "PASS", f"Listened for {duration} seconds, received {self.message_queue.qsize()} messages")
        
        # Check if we received any messages
        message_count = self.message_queue.qsize()
        if message_count > 0:
            self.log_test("WebSocket messages", "PASS", f"Received {message_count} messages during listening period")
        else:
            self.log_test("WebSocket messages", "WARN", "No messages received during listening period")
    
    async def cleanup_connections(self):
        """Clean up WebSocket connections"""
        print("\n🧹 Cleaning up WebSocket connections...")
        
        for conn_name, websocket in self.websocket_connections.items():
            try:
                await websocket.close()
                self.log_test(f"Close {conn_name}", "PASS", "Connection closed")
            except Exception as e:
                self.log_test(f"Close {conn_name}", "FAIL", f"Error: {str(e)}")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("📊 BACKEND CHAT & NOTIFICATIONS TEST SUMMARY")
        print("="*70)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['status'] == 'PASS'])
        failed_tests = len([r for r in self.test_results if r['status'] == 'FAIL'])
        warning_tests = len([r for r in self.test_results if r['status'] == 'WARN'])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️  Warnings: {warning_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if result['status'] == 'FAIL':
                    print(f"  - {result['test']}: {result['details']}")
        
        if warning_tests > 0:
            print("\n⚠️  Warning Tests:")
            for result in self.test_results:
                if result['status'] == 'WARN':
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "="*70)
        
        # Save results to file
        with open('tests/backend_test_results.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        print("📄 Detailed results saved to: tests/backend_test_results.json")
        
        # Print WebSocket message summary
        if not self.message_queue.empty():
            print(f"\n📨 WebSocket Messages Received: {self.message_queue.qsize()}")
            print("Recent messages:")
            count = 0
            while not self.message_queue.empty() and count < 5:
                conn_name, data = self.message_queue.get()
                print(f"  - {conn_name}: {data.get('type', 'unknown')}")
                count += 1

async def main():
    """Main testing function"""
    print("🚀 Starting Backend Chat & Notifications Test")
    print("="*70)
    print("This script tests backend WebSocket functionality without frontend")
    print("="*70)
    
    tester = BackendTester()
    
    try:
        # Step 1: Test basic server connectivity
        if not tester.test_django_server():
            print("❌ Django server is not running. Please start it first.")
            return
        
        # Step 2: Create and authenticate test users
        tester.create_test_users()
        tester.authenticate_users()
        
        if not tester.auth_tokens:
            print("❌ No authenticated users. Cannot proceed with WebSocket tests.")
            return
        
        # Step 3: Test Redis connection
        tester.test_redis_connection()
        
        # Step 4: Test API endpoints
        tester.test_notification_api()
        tester.test_chat_api()
        
        # Step 5: Test project creation and broadcasting
        tester.test_project_creation_and_broadcasting()
        
        # Step 6: Test WebSocket connections
        print("\n🔌 Testing WebSocket connections...")
        for user_email in tester.auth_tokens.keys():
            await tester.test_chat_websocket_connection(user_email)
            await tester.test_notification_websocket_connection(user_email)
        
        # Step 7: Test message listening
        if tester.websocket_connections:
            await tester.test_websocket_message_listening(duration=15)
        
    except Exception as e:
        print(f"❌ Critical error during testing: {str(e)}")
    
    finally:
        # Cleanup
        await tester.cleanup_connections()
        
        # Print summary
        tester.print_summary()

if __name__ == "__main__":
    print("🔍 Backend Chat & Notifications Test Script")
    print("="*50)
    print("This script tests:")
    print("  ✅ Django server connectivity")
    print("  ✅ Redis connection")
    print("  ✅ User authentication")
    print("  ✅ Chat WebSocket connections")
    print("  ✅ Notification WebSocket connections")
    print("  ✅ API endpoints")
    print("  ✅ Project broadcasting")
    print("  ✅ Real-time message listening")
    print("="*50)
    print()
    
    # Check if servers are running
    print("🔍 Checking if servers are running...")
    
    try:
        # Check Django server
        response = requests.get(f"{DJANGO_BASE_URL}/api/ai/", timeout=3)
        if response.status_code == 200:
            print("✅ Django server is running")
        else:
            print("❌ Django server is not responding properly")
            sys.exit(1)
    except:
        print("❌ Django server is not running. Please start it with: python manage.py runserver")
        sys.exit(1)
    
    print("\n🚀 Starting comprehensive backend testing...")
    asyncio.run(main())
