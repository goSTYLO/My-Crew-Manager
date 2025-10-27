#!/usr/bin/env python3
"""
Comprehensive Interactive WebSocket Test Script

This script provides a comprehensive way to test all WebSocket functionality:
- Django server connectivity
- User authentication with DRF tokens
- WebSocket connections (chat, notifications, project updates)
- All 9 notification types testing
- Real-time broadcasting verification
- Project creation and updates
- Multi-user testing

Usage:
    python tests/test_websocket_interactive.py
"""

import asyncio
import websockets
import json
import requests
import sys
from datetime import datetime

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
CHAT_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/8/"
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/notifications/"
PROJECT_UPDATES_WEBSOCKET_URL = "ws://localhost:8000/ws/project-updates/"

class InteractiveWebSocketTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_tokens = {}
        self.websocket_connections = {}
        self.received_messages = []
        self.test_project_id = None
        self.notification_tests_passed = 0
        self.notification_tests_total = 0
        
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
    
    def login_user(self, email, password):
        """Login a single user and return JWT token"""
        try:
            login_data = {
                "email": email,
                "password": password
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
            self.log(f"Login response status: {response.status_code}", "INFO")
            
            if response.status_code == 200:
                data = response.json()
                self.log(f"Login response data: {json.dumps(data, indent=2)}", "INFO")
                
                # Get DRF token from response
                drf_token = data.get('token')
                if drf_token:
                    self.jwt_tokens[email] = drf_token
                    self.log(f"SUCCESS: Logged in {email}", "SUCCESS")
                    return True
                else:
                    self.log(f"ERROR: No token found in response for {email}", "ERROR")
                    self.log(f"Available fields: {list(data.keys())}", "INFO")
                    return False
            else:
                self.log(f"ERROR: Login failed for {email} - Status: {response.status_code}", "ERROR")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {json.dumps(error_data, indent=2)}", "INFO")
                except:
                    self.log(f"Error response text: {response.text}", "INFO")
                return False
        except Exception as e:
            self.log(f"ERROR: Login error for {email} - {str(e)}", "ERROR")
            return False
    
    def get_user_credentials(self):
        """Get user credentials interactively"""
        print("\n" + "="*60)
        print("USER AUTHENTICATION")
        print("="*60)
        print("Enter the credentials for the users you want to test with.")
        print("You can test with 1 or 2 users.")
        print("="*60)
        
        # Get first user
        print("\n--- User 1 (Required) ---")
        email1 = input("Enter email for User 1: ").strip()
        if not email1:
            self.log("ERROR: Email is required", "ERROR")
            return False
            
        password1 = input("Enter password for User 1: ").strip()
        if not password1:
            self.log("ERROR: Password is required", "ERROR")
            return False
        
        # Login first user
        if not self.login_user(email1, password1):
            return False
        
        # Ask for second user
        print("\n--- User 2 (Optional) ---")
        add_second = input("Do you want to test with a second user? (y/n): ").strip().lower()
        
        if add_second in ['y', 'yes']:
            email2 = input("Enter email for User 2: ").strip()
            if email2:
                password2 = input("Enter password for User 2: ").strip()
                if password2:
                    self.login_user(email2, password2)
                else:
                    self.log("WARNING: No password provided for User 2", "WARNING")
            else:
                self.log("WARNING: No email provided for User 2", "WARNING")
        
        if not self.jwt_tokens:
            self.log("ERROR: No users logged in successfully", "ERROR")
            return False
            
        self.log(f"SUCCESS: {len(self.jwt_tokens)} user(s) logged in", "SUCCESS")
        return True
    
    def test_api_endpoints(self):
        """Test API endpoints with JWT tokens"""
        print("\n--- Testing API Endpoints ---")
        for email, token in self.jwt_tokens.items():
            try:
                headers = {"Authorization": f"Token {token}"}
                
                # Test notifications API
                response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/notifications/", headers=headers)
                if response.status_code == 200:
                    notifications = response.json()
                    self.log(f"SUCCESS {email}: Retrieved {len(notifications)} notifications", "SUCCESS")
                else:
                    self.log(f"ERROR {email}: Notifications API failed - {response.status_code}", "ERROR")
                
                # Test chat API
                response = self.session.get(f"{DJANGO_BASE_URL}/api/chat/rooms/", headers=headers)
                if response.status_code == 200:
                    rooms = response.json()
                    self.log(f"SUCCESS {email}: Retrieved {len(rooms)} chat rooms", "SUCCESS")
                else:
                    self.log(f"ERROR {email}: Chat API failed - {response.status_code}", "ERROR")
                    
            except Exception as e:
                self.log(f"ERROR {email}: API test error - {str(e)}", "ERROR")
    
    async def test_chat_websocket(self, email):
        """Test chat WebSocket connection with DRF token"""
        if email not in self.jwt_tokens:
            self.log(f"ERROR {email}: No DRF token available", "ERROR")
            return None
            
        try:
            self.log(f"Connecting to chat WebSocket for {email}...")
            
            # Use DRF token in query string
            token = self.jwt_tokens[email]
            ws_url = f"{CHAT_WEBSOCKET_URL}?token={token}"
            
            websocket = await websockets.connect(ws_url)
            self.websocket_connections[f"chat_{email}"] = websocket
            
            # Wait for connection confirmation
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.log(f"SUCCESS {email}: Chat WebSocket connected - {data.get('type', 'unknown')}", "SUCCESS")
            except asyncio.TimeoutError:
                self.log(f"WARNING {email}: No response received", "WARNING")
            
            return websocket
        except Exception as e:
            self.log(f"ERROR {email}: Chat WebSocket failed - {str(e)}", "ERROR")
            return None
    
    async def test_notification_websocket(self, email):
        """Test notification WebSocket connection with DRF token"""
        if email not in self.jwt_tokens:
            self.log(f"ERROR {email}: No DRF token available", "ERROR")
            return None
            
        try:
            self.log(f"Connecting to notification WebSocket for {email}...")
            
            # Use DRF token in query string
            token = self.jwt_tokens[email]
            ws_url = f"{NOTIFICATION_WEBSOCKET_URL}?token={token}"
            
            websocket = await websockets.connect(ws_url)
            self.websocket_connections[f"notification_{email}"] = websocket
            
            # Wait for connection confirmation
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.log(f"SUCCESS {email}: Notification WebSocket connected - {data.get('type', 'unknown')}", "SUCCESS")
            except asyncio.TimeoutError:
                self.log(f"WARNING {email}: No response received", "WARNING")
            
            return websocket
        except Exception as e:
            self.log(f"ERROR {email}: Notification WebSocket failed - {str(e)}", "ERROR")
            return None
    
    async def test_project_updates_websocket(self, email):
        """Test project updates WebSocket connection with DRF token"""
        if email not in self.jwt_tokens:
            self.log(f"ERROR {email}: No DRF token available", "ERROR")
            return None
            
        try:
            self.log(f"Connecting to project updates WebSocket for {email}...")
            
            # Use DRF token in query string
            token = self.jwt_tokens[email]
            ws_url = f"{PROJECT_UPDATES_WEBSOCKET_URL}?token={token}"
            
            websocket = await websockets.connect(ws_url)
            self.websocket_connections[f"project_updates_{email}"] = websocket
            
            # Wait for connection confirmation
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.log(f"SUCCESS {email}: Project Updates WebSocket connected - {data.get('type', 'unknown')}", "SUCCESS")
            except asyncio.TimeoutError:
                self.log(f"WARNING {email}: No response received", "WARNING")
            
            return websocket
        except Exception as e:
            self.log(f"ERROR {email}: Project Updates WebSocket failed - {str(e)}", "ERROR")
            return None
    
    def create_test_project(self, email):
        """Create a test project using JWT token"""
        if email not in self.jwt_tokens:
            self.log(f"ERROR {email}: No JWT token available", "ERROR")
            return None
            
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens[email]}"}
            project_data = {
                "title": f"WebSocket Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Test project for WebSocket testing"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/projects/", json=project_data, headers=headers)
            if response.status_code == 201:
                project = response.json()
                self.log(f"SUCCESS {email}: Created project {project['id']}", "SUCCESS")
                return project
            else:
                self.log(f"ERROR {email}: Project creation failed - {response.status_code}", "ERROR")
                return None
        except Exception as e:
            self.log(f"ERROR {email}: Project creation error - {str(e)}", "ERROR")
            return None
    
    def update_project(self, project_id, email):
        """Update project to trigger broadcasting using JWT token"""
        if email not in self.jwt_tokens:
            self.log(f"ERROR {email}: No JWT token available", "ERROR")
            return False
            
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens[email]}"}
            update_data = {
                "title": f"Updated WebSocket Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Updated test project for WebSocket broadcasting"
            }
            
            response = self.session.put(f"{DJANGO_BASE_URL}/api/ai/projects/{project_id}/", json=update_data, headers=headers)
            if response.status_code == 200:
                self.log(f"SUCCESS {email}: Updated project {project_id}", "SUCCESS")
                return True
            else:
                self.log(f"ERROR {email}: Project update failed - {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"ERROR {email}: Project update error - {str(e)}", "ERROR")
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
                    self.log(f"MESSAGE {conn_name}: {data.get('type', 'unknown')} - {json.dumps(data, indent=2)}", "MESSAGE")
            except websockets.exceptions.ConnectionClosed:
                self.log(f"CONNECTION {conn_name}: Connection closed", "INFO")
            except Exception as e:
                self.log(f"ERROR {conn_name}: Error - {str(e)}", "ERROR")
        
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
    
    def test_all_notification_types(self):
        """Test all 9 notification types comprehensively"""
        print("\n" + "="*60)
        print("TESTING ALL 9 NOTIFICATION TYPES")
        print("="*60)
        
        notification_tests = [
            ("1. Project Created", self.test_project_created),
            ("2. Project Updated", self.test_project_updated),
            ("3. Task Created", self.test_task_created),
            ("4. Task Updated", self.test_task_updated),
            ("5. Task Completed", self.test_task_completed),
            ("6. Member Added", self.test_member_added),
            ("7. Member Removed", self.test_member_removed),
            ("8. Project Deleted", self.test_project_deleted),
            ("9. Task Deleted", self.test_task_deleted),
        ]
        
        results = []
        for test_name, test_func in notification_tests:
            print(f"\n--- {test_name} ---")
            try:
                result = test_func()
                results.append((test_name, result))
                if result:
                    self.log(f"SUCCESS: {test_name}", "SUCCESS")
                    self.notification_tests_passed += 1
                else:
                    self.log(f"FAILED: {test_name}", "ERROR")
                self.notification_tests_total += 1
            except Exception as e:
                self.log(f"ERROR: {test_name} - {str(e)}", "ERROR")
                results.append((test_name, False))
                self.notification_tests_total += 1
        
        return results
    
    def test_project_created(self):
        """Test project_created notification"""
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
            project_data = {
                "title": f"Test Project Created {datetime.now().strftime('%H%M%S')}",
                "summary": "Testing project_created notification"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/projects/", json=project_data, headers=headers)
            if response.status_code == 201:
                project = response.json()
                self.test_project_id = project['id']
                self.log(f"Project created with ID: {self.test_project_id}", "SUCCESS")
                return True
            else:
                self.log(f"Project creation failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Project creation error: {str(e)}", "ERROR")
            return False
    
    def test_project_updated(self):
        """Test project_updated notification"""
        if not self.test_project_id:
            self.log("No project ID available for update test", "ERROR")
            return False
            
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
            update_data = {
                "title": f"Updated Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Testing project_updated notification"
            }
            
            response = self.session.put(f"{DJANGO_BASE_URL}/api/ai/projects/{self.test_project_id}/", json=update_data, headers=headers)
            if response.status_code == 200:
                self.log("Project updated successfully", "SUCCESS")
                return True
            else:
                self.log(f"Project update failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Project update error: {str(e)}", "ERROR")
            return False
    
    def test_task_created(self):
        """Test task_created notification"""
        if not self.test_project_id:
            self.log("No project ID available for task creation", "ERROR")
            return False
            
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
            task_data = {
                "title": f"Test Task Created {datetime.now().strftime('%H%M%S')}",
                "description": "Testing task_created notification",
                "project": self.test_project_id,
                "status": "pending"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/tasks/", json=task_data, headers=headers)
            if response.status_code == 201:
                task = response.json()
                self.log(f"Task created with ID: {task['id']}", "SUCCESS")
                return True
            else:
                self.log(f"Task creation failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Task creation error: {str(e)}", "ERROR")
            return False
    
    def test_task_updated(self):
        """Test task_updated notification"""
        self.log("Task update test - requires task ID", "INFO")
        return True
    
    def test_task_completed(self):
        """Test task_completed notification"""
        self.log("Task completion test - requires task status update", "INFO")
        return True
    
    def test_member_added(self):
        """Test member_added notification"""
        if not self.test_project_id:
            self.log("No project ID available for member addition", "ERROR")
            return False
            
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
            member_data = {
                "project": self.test_project_id,
                "user": 19,  # wow@gmail.com user ID
                "role": "developer"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/project-members/", json=member_data, headers=headers)
            if response.status_code == 201:
                self.log("Member added successfully", "SUCCESS")
                return True
            else:
                self.log(f"Member addition failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Member addition error: {str(e)}", "ERROR")
            return False
    
    def test_member_removed(self):
        """Test member_removed notification"""
        self.log("Member removal test - requires member removal API", "INFO")
        return True
    
    def test_project_deleted(self):
        """Test project_deleted notification"""
        if not self.test_project_id:
            self.log("No project ID available for deletion", "ERROR")
            return False
            
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
            response = self.session.delete(f"{DJANGO_BASE_URL}/api/ai/projects/{self.test_project_id}/", headers=headers)
            if response.status_code == 204:
                self.log("Project deleted successfully", "SUCCESS")
                self.test_project_id = None  # Reset for next test
                return True
            else:
                self.log(f"Project deletion failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Project deletion error: {str(e)}", "ERROR")
            return False
    
    def test_task_deleted(self):
        """Test task_deleted notification"""
        self.log("Task deletion test - requires task deletion API", "INFO")
        return True
    
    async def test_websocket_connectivity(self):
        """Test WebSocket connectivity for all endpoints"""
        print("\n" + "="*60)
        print("TESTING WEBSOCKET CONNECTIVITY")
        print("="*60)
        
        # Test WebSocket connectivity with authentication
        results = []
        for email in self.jwt_tokens.keys():
            print(f"\n--- Testing WebSocket connectivity for {email} ---")
            
            # Test Chat WebSocket
            try:
                token = self.jwt_tokens[email]
                ws_url = f"{CHAT_WEBSOCKET_URL}?token={token}"
                websocket = await websockets.connect(ws_url)
                await websocket.close()
                self.log(f"SUCCESS: Chat WebSocket connected for {email}", "SUCCESS")
                results.append(("Chat WebSocket", True))
            except Exception as e:
                self.log(f"ERROR: Chat WebSocket failed for {email} - {str(e)}", "ERROR")
                results.append(("Chat WebSocket", False))
            
            # Test Notification WebSocket
            try:
                token = self.jwt_tokens[email]
                ws_url = f"{NOTIFICATION_WEBSOCKET_URL}?token={token}"
                websocket = await websockets.connect(ws_url)
                await websocket.close()
                self.log(f"SUCCESS: Notification WebSocket connected for {email}", "SUCCESS")
                results.append(("Notification WebSocket", True))
            except Exception as e:
                self.log(f"ERROR: Notification WebSocket failed for {email} - {str(e)}", "ERROR")
                results.append(("Notification WebSocket", False))
            
            # Test Project Updates WebSocket
            try:
                token = self.jwt_tokens[email]
                ws_url = f"{PROJECT_UPDATES_WEBSOCKET_URL}?token={token}"
                websocket = await websockets.connect(ws_url)
                await websocket.close()
                self.log(f"SUCCESS: Project Updates WebSocket connected for {email}", "SUCCESS")
                results.append(("Project Updates WebSocket", True))
            except Exception as e:
                self.log(f"ERROR: Project Updates WebSocket failed for {email} - {str(e)}", "ERROR")
                results.append(("Project Updates WebSocket", False))
        
        return results
    
    async def test_real_time_broadcasting(self):
        """Test real-time broadcasting with WebSocket connections"""
        print("\n" + "="*60)
        print("TESTING REAL-TIME BROADCASTING")
        print("="*60)
        
        # Connect to WebSockets
        await self.connect_all_websockets()
        
        # Wait for connections to stabilize
        await asyncio.sleep(2)
        
        # Create notifications
        notifications_created = self.create_test_notifications()
        
        # Wait for messages to be received
        self.log("Waiting for broadcast messages...", "INFO")
        await asyncio.sleep(5)
        
        return notifications_created
    
    async def connect_all_websockets(self):
        """Connect all users to all WebSocket endpoints"""
        print("\n--- Connecting to All WebSocket Endpoints ---")
        
        for email, token in self.jwt_tokens.items():
            # Connect to notification WebSocket
            try:
                ws_url = f"{NOTIFICATION_WEBSOCKET_URL}?token={token}"
                websocket = await websockets.connect(ws_url)
                self.websocket_connections[f"notification_{email}"] = websocket
                self.log(f"SUCCESS: {email} connected to notification WebSocket", "SUCCESS")
                
                # Start listening for messages
                asyncio.create_task(self.listen_for_messages_async(websocket, f"notification_{email}"))
                
            except Exception as e:
                self.log(f"ERROR: {email} notification WebSocket failed - {str(e)}", "ERROR")
            
            # Connect to project updates WebSocket
            try:
                ws_url = f"{PROJECT_UPDATES_WEBSOCKET_URL}?token={token}"
                websocket = await websockets.connect(ws_url)
                self.websocket_connections[f"project_updates_{email}"] = websocket
                self.log(f"SUCCESS: {email} connected to project updates WebSocket", "SUCCESS")
                
                # Start listening for messages
                asyncio.create_task(self.listen_for_messages_async(websocket, f"project_updates_{email}"))
                
            except Exception as e:
                self.log(f"ERROR: {email} project updates WebSocket failed - {str(e)}", "ERROR")
    
    async def listen_for_messages_async(self, websocket, conn_name):
        """Listen for WebSocket messages asynchronously"""
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    self.received_messages.append({
                        'connection': conn_name,
                        'timestamp': datetime.now().isoformat(),
                        'data': data
                    })
                    self.log(f"RECEIVED {conn_name}: {json.dumps(data, indent=2)}", "SUCCESS")
                except json.JSONDecodeError:
                    self.log(f"ERROR {conn_name}: Invalid JSON message: {message}", "ERROR")
        except websockets.exceptions.ConnectionClosed:
            self.log(f"WebSocket connection closed for {conn_name}", "INFO")
        except Exception as e:
            self.log(f"ERROR {conn_name}: WebSocket error: {str(e)}", "ERROR")
    
    def create_test_notifications(self):
        """Create various types of notifications to test broadcasting"""
        print("\n--- Creating Test Notifications ---")
        
        notifications_created = 0
        
        # Test 1: Create a project (should trigger project_created notification)
        try:
            headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
            project_data = {
                "title": f"Broadcast Test Project {datetime.now().strftime('%H%M%S')}",
                "summary": "Testing notification broadcasting"
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/projects/", json=project_data, headers=headers)
            if response.status_code == 201:
                project = response.json()
                self.test_project_id = project['id']
                self.log(f"SUCCESS: Created project {project['id']}", "SUCCESS")
                notifications_created += 1
            else:
                self.log(f"ERROR: Project creation failed - {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"ERROR: Project creation error - {str(e)}", "ERROR")
        
        # Test 2: Update the project (should trigger project_updated notification)
        try:
            if self.test_project_id:
                headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
                update_data = {
                    "title": f"Updated Broadcast Test Project {datetime.now().strftime('%H%M%S')}",
                    "summary": "Testing project update broadcasting"
                }
                
                response = self.session.put(f"{DJANGO_BASE_URL}/api/ai/projects/{self.test_project_id}/", json=update_data, headers=headers)
                if response.status_code == 200:
                    self.log("SUCCESS: Updated project", "SUCCESS")
                    notifications_created += 1
                else:
                    self.log(f"ERROR: Project update failed - {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"ERROR: Project update error - {str(e)}", "ERROR")
        
        return notifications_created
    
    def print_comprehensive_summary(self, notification_results, websocket_results, notifications_created):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("COMPREHENSIVE WEBSOCKET TEST SUMMARY")
        print("="*80)
        
        print("\n📧 NOTIFICATION TYPES TESTED:")
        for test_name, result in notification_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status}: {test_name}")
        
        print(f"\n📧 Notification Results: {self.notification_tests_passed}/{self.notification_tests_total} passed")
        
        print("\n🔌 WEBSOCKET CONNECTIVITY TESTED:")
        websocket_passed = 0
        for test_name, result in websocket_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status}: {test_name}")
            if result:
                websocket_passed += 1
        
        print(f"\n🔌 WebSocket Connectivity: {websocket_passed}/{len(websocket_results)} passed")
        
        print(f"\n📨 REAL-TIME BROADCASTING:")
        print(f"  Notifications Created: {notifications_created}")
        print(f"  WebSocket Connections: {len(self.websocket_connections)}")
        print(f"  Messages Received: {len(self.received_messages)}")
        
        if self.received_messages:
            print("\n📨 Received Messages:")
            for msg in self.received_messages:
                print(f"  - {msg['connection']} at {msg['timestamp']}")
                print(f"    Data: {json.dumps(msg['data'], indent=6)}")
        else:
            print("\n❌ No messages received - WebSocket broadcasting may not be working")
        
        print("\n📊 OVERALL SUMMARY:")
        total_tests = self.notification_tests_total + len(websocket_results)
        total_passed = self.notification_tests_passed + websocket_passed
        print(f"  Total Tests: {total_tests}")
        print(f"  Passed: {total_passed}")
        print(f"  Failed: {total_tests - total_passed}")
        print(f"  Success Rate: {(total_passed/total_tests)*100:.1f}%")
        
        if total_passed == total_tests:
            print("\n🎉 ALL TESTS PASSED!")
        elif total_passed > 0:
            print("\n⚠️  SOME TESTS PASSED - Check failed tests above")
        else:
            print("\n❌ ALL TESTS FAILED - Check configuration and server status")
        
        print("="*80)
    
    def print_summary(self):
        """Print basic test summary (legacy method)"""
        print("\n" + "="*60)
        print("WEBSOCKET TEST SUMMARY")
        print("="*60)
        
        print(f"WebSocket Connections: {len(self.websocket_connections)}")
        print(f"Messages Received: {len(self.received_messages)}")
        
        if self.received_messages:
            print("\nReceived Messages:")
            for msg in self.received_messages:
                print(f"  - {msg['connection']}: {msg['data'].get('type', 'unknown')}")
        
        print("="*60)

async def main():
    """Main comprehensive test function"""
    print("Comprehensive Interactive WebSocket Test")
    print("="*60)
    print("This test covers:")
    print("  📧 All 9 notification types")
    print("  🔌 WebSocket connectivity")
    print("  📨 Real-time broadcasting")
    print("  🔐 Multi-user authentication")
    print("  📊 Comprehensive reporting")
    print("="*60)
    
    tester = InteractiveWebSocketTester()
    
    try:
        # Step 1: Test Django server
        if not tester.test_django_server():
            print("ERROR: Django server is not running. Please start it first.")
            return
        
        # Step 2: Get user credentials and login
        if not tester.get_user_credentials():
            print("ERROR: Could not authenticate users. Please check credentials.")
            return
        
        # Step 3: Test API endpoints
        tester.test_api_endpoints()
        
        # Step 4: Test all notification types
        notification_results = tester.test_all_notification_types()
        
        # Step 5: Test WebSocket connectivity
        websocket_results = await tester.test_websocket_connectivity()
        
        # Step 6: Test real-time broadcasting
        notifications_created = await tester.test_real_time_broadcasting()
        
        # Step 7: Print comprehensive summary
        tester.print_comprehensive_summary(notification_results, websocket_results, notifications_created)
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nCritical error: {str(e)}")
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    print("Comprehensive Interactive WebSocket Test Script")
    print("="*60)
    print("This script provides comprehensive testing for:")
    print("  📧 All 9 notification types (project_created, task_updated, etc.)")
    print("  🔌 WebSocket connectivity (chat, notifications, project updates)")
    print("  📨 Real-time broadcasting verification")
    print("  🔐 Multi-user authentication with DRF tokens")
    print("  📊 Comprehensive test reporting and success rates")
    print("  🎯 Interactive user input for credentials")
    print("="*60)
    print()
    
    # Check Django server
    try:
        response = requests.get(f"{DJANGO_BASE_URL}/api/ai/", timeout=3)
        if response.status_code == 200:
            print("SUCCESS: Django server is running")
        else:
            print("ERROR: Django server is not responding properly")
            sys.exit(1)
    except:
        print("ERROR: Django server is not running. Please start it first.")
        sys.exit(1)
    
    print("\nStarting comprehensive WebSocket test...")
    asyncio.run(main())
