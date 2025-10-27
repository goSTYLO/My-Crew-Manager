#!/usr/bin/env python3
"""
Notification Broadcasting Test

This script specifically tests the notification broadcasting system:
1. Creates notifications via API
2. Tests WebSocket connections for real-time updates
3. Verifies that notifications are broadcast to all connected users

Usage:
    python tests/test_notification_broadcasting.py
"""

import asyncio
import websockets
import json
import requests
import sys
from datetime import datetime

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
NOTIFICATION_WEBSOCKET_URL = "ws://localhost:8000/ws/chat/notifications/"
PROJECT_UPDATES_WEBSOCKET_URL = "ws://localhost:8000/ws/project-updates/"

class NotificationBroadcastingTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_tokens = {}
        self.websocket_connections = {}
        self.received_messages = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def authenticate_users(self):
        """Authenticate both test users"""
        print("\n--- Authenticating Users ---")
        
        # User 1: adminaaron@gmail.com
        if not self.get_token("adminaaron@gmail.com", "password123"):
            return False
        
        # User 2: wow@gmail.com  
        if not self.get_token("wow@gmail.com", "Pass_123"):
            return False
        
        self.log("Both users authenticated successfully", "SUCCESS")
        return True
    
    def get_token(self, email, password):
        """Get DRF token for user"""
        try:
            login_data = {"email": email, "password": password}
            response = self.session.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token')
                if token:
                    self.jwt_tokens[email] = token
                    self.log(f"SUCCESS: Got token for {email}", "SUCCESS")
                    return True
            
            self.log(f"ERROR: Login failed for {email} - {response.status_code}", "ERROR")
            return False
        except Exception as e:
            self.log(f"ERROR: Login error for {email} - {str(e)}", "ERROR")
            return False
    
    async def connect_websockets(self):
        """Connect both users to notification WebSockets"""
        print("\n--- Connecting to Notification WebSockets ---")
        
        for email, token in self.jwt_tokens.items():
            try:
                # Connect to notification WebSocket
                ws_url = f"{NOTIFICATION_WEBSOCKET_URL}?token={token}"
                websocket = await websockets.connect(ws_url)
                self.websocket_connections[f"notification_{email}"] = websocket
                self.log(f"SUCCESS: {email} connected to notification WebSocket", "SUCCESS")
                
                # Start listening for messages
                asyncio.create_task(self.listen_for_messages(websocket, email))
                
            except Exception as e:
                self.log(f"ERROR: {email} notification WebSocket failed - {str(e)}", "ERROR")
        
        # Also test project updates WebSocket
        try:
            token = self.jwt_tokens["adminaaron@gmail.com"]
            ws_url = f"{PROJECT_UPDATES_WEBSOCKET_URL}?token={token}"
            websocket = await websockets.connect(ws_url)
            self.websocket_connections["project_updates"] = websocket
            self.log("SUCCESS: Connected to project updates WebSocket", "SUCCESS")
            asyncio.create_task(self.listen_for_messages(websocket, "project_updates"))
        except Exception as e:
            self.log(f"ERROR: Project updates WebSocket failed - {str(e)}", "ERROR")
    
    async def listen_for_messages(self, websocket, user_id):
        """Listen for WebSocket messages"""
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    self.received_messages.append({
                        'user': user_id,
                        'timestamp': datetime.now().isoformat(),
                        'data': data
                    })
                    self.log(f"RECEIVED: {user_id} - {json.dumps(data, indent=2)}", "SUCCESS")
                except json.JSONDecodeError:
                    self.log(f"ERROR: {user_id} - Invalid JSON message: {message}", "ERROR")
        except websockets.exceptions.ConnectionClosed:
            self.log(f"WebSocket connection closed for {user_id}", "INFO")
        except Exception as e:
            self.log(f"ERROR: {user_id} - WebSocket error: {str(e)}", "ERROR")
    
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
                self.log(f"SUCCESS: Created project {project['id']}", "SUCCESS")
                notifications_created += 1
            else:
                self.log(f"ERROR: Project creation failed - {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"ERROR: Project creation error - {str(e)}", "ERROR")
        
        # Test 2: Update the project (should trigger project_updated notification)
        try:
            if 'project' in locals():
                headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
                update_data = {
                    "title": f"Updated Broadcast Test Project {datetime.now().strftime('%H%M%S')}",
                    "summary": "Testing project update broadcasting"
                }
                
                response = self.session.put(f"{DJANGO_BASE_URL}/api/ai/projects/{project['id']}/", json=update_data, headers=headers)
                if response.status_code == 200:
                    self.log("SUCCESS: Updated project", "SUCCESS")
                    notifications_created += 1
                else:
                    self.log(f"ERROR: Project update failed - {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"ERROR: Project update error - {str(e)}", "ERROR")
        
        # Test 3: Create a task (should trigger task_created notification)
        try:
            if 'project' in locals():
                headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
                task_data = {
                    "title": f"Broadcast Test Task {datetime.now().strftime('%H%M%S')}",
                    "description": "Testing task creation broadcasting",
                    "project": project['id'],
                    "status": "pending"
                }
                
                response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/tasks/", json=task_data, headers=headers)
                if response.status_code == 201:
                    task = response.json()
                    self.log(f"SUCCESS: Created task {task['id']}", "SUCCESS")
                    notifications_created += 1
                else:
                    self.log(f"ERROR: Task creation failed - {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"ERROR: Task creation error - {str(e)}", "ERROR")
        
        # Test 4: Add a member (should trigger member_added notification)
        try:
            if 'project' in locals():
                headers = {"Authorization": f"Token {self.jwt_tokens['adminaaron@gmail.com']}"}
                member_data = {
                    "project": project['id'],
                    "user": 19,  # wow@gmail.com user ID
                    "role": "developer"
                }
                
                response = self.session.post(f"{DJANGO_BASE_URL}/api/ai/project-members/", json=member_data, headers=headers)
                if response.status_code == 201:
                    self.log("SUCCESS: Added member to project", "SUCCESS")
                    notifications_created += 1
                else:
                    self.log(f"ERROR: Member addition failed - {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"ERROR: Member addition error - {str(e)}", "ERROR")
        
        return notifications_created
    
    async def run_broadcasting_test(self):
        """Run the complete broadcasting test"""
        print("Notification Broadcasting Test")
        print("="*60)
        print("This test verifies that notifications are broadcast in real-time")
        print("="*60)
        
        # Step 1: Authenticate users
        if not self.authenticate_users():
            self.log("Authentication failed, cannot proceed", "ERROR")
            return False
        
        # Step 2: Connect WebSockets
        await self.connect_websockets()
        
        # Step 3: Wait a moment for connections to stabilize
        await asyncio.sleep(2)
        
        # Step 4: Create notifications
        notifications_created = self.create_test_notifications()
        
        # Step 5: Wait for messages to be received
        self.log("Waiting for broadcast messages...", "INFO")
        await asyncio.sleep(5)
        
        # Step 6: Analyze results
        self.print_results(notifications_created)
        
        # Step 7: Clean up
        await self.cleanup()
        
        return True
    
    def print_results(self, notifications_created):
        """Print test results"""
        print("\n" + "="*60)
        print("NOTIFICATION BROADCASTING TEST RESULTS")
        print("="*60)
        
        print(f"\n📧 Notifications Created: {notifications_created}")
        print(f"🔌 WebSocket Connections: {len(self.websocket_connections)}")
        print(f"📨 Messages Received: {len(self.received_messages)}")
        
        if self.received_messages:
            print("\n📨 Received Messages:")
            for i, msg in enumerate(self.received_messages, 1):
                print(f"  {i}. {msg['user']} at {msg['timestamp']}")
                print(f"     Data: {json.dumps(msg['data'], indent=6)}")
        else:
            print("\n❌ No messages received - WebSocket broadcasting may not be working")
        
        # Calculate success rate
        if notifications_created > 0 and len(self.received_messages) > 0:
            success_rate = (len(self.received_messages) / notifications_created) * 100
            print(f"\n📊 Success Rate: {success_rate:.1f}%")
            if success_rate >= 50:
                print("✅ Broadcasting appears to be working")
            else:
                print("⚠️  Broadcasting may have issues")
        else:
            print("\n❌ Cannot determine success rate - no notifications created or received")
    
    async def cleanup(self):
        """Clean up WebSocket connections"""
        print("\n--- Cleaning up WebSocket connections ---")
        for name, websocket in self.websocket_connections.items():
            try:
                await websocket.close()
                self.log(f"Closed WebSocket: {name}", "INFO")
            except Exception as e:
                self.log(f"Error closing {name}: {str(e)}", "ERROR")

async def main():
    """Main test function"""
    tester = NotificationBroadcastingTester()
    
    try:
        await tester.run_broadcasting_test()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
        await tester.cleanup()
    except Exception as e:
        print(f"\nCritical error: {str(e)}")
        await tester.cleanup()

if __name__ == "__main__":
    print("Notification Broadcasting Test Script")
    print("="*60)
    print("This script tests:")
    print("  📧 Notification creation via API")
    print("  🔌 WebSocket connections for real-time updates")
    print("  📨 Message broadcasting to connected users")
    print("  📊 Success rate calculation")
    print("="*60)
    print()
    
    asyncio.run(main())
