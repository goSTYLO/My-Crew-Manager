#!/usr/bin/env python3
"""
Simple WebSocket Test with JWT Tokens

This script tests WebSocket functionality using JWT tokens
instead of DRF tokens.

Usage:
    python tests/test_websocket_simple.py
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

class SimpleWebSocketTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_tokens = {}
        self.websocket_connections = {}
        self.received_messages = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def get_jwt_tokens(self):
        """Get JWT tokens by logging in with user input"""
        try:
            print("\n" + "="*50)
            print("USER AUTHENTICATION")
            print("="*50)
            print("Enter credentials for the users you want to test with.")
            print("You can test with 1 or 2 users.")
            print("="*50)
            
            # Get first user credentials
            print("\n--- User 1 ---")
            email1 = input("Enter email for User 1: ").strip()
            if not email1:
                self.log("ERROR: Email is required", "ERROR")
                return False
                
            password1 = input("Enter password for User 1: ").strip()
            if not password1:
                self.log("ERROR: Password is required", "ERROR")
                return False
            
            # Login first user
            login_data = {
                "email": email1,
                "password": password1
            }
            
            response = self.session.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
            if response.status_code == 200:
                data = response.json()
                drf_token = data.get('token')
                if drf_token:
                    self.jwt_tokens[email1] = drf_token
                    self.log(f"SUCCESS: Got DRF token for {email1}", "SUCCESS")
                else:
                    self.log(f"ERROR: No token in response for {email1}", "ERROR")
                    return False
            else:
                self.log(f"ERROR: Login failed for {email1} - Status: {response.status_code}", "ERROR")
                return False
            
            # Ask if user wants to test with second user
            print("\n--- User 2 (Optional) ---")
            add_second = input("Do you want to test with a second user? (y/n): ").strip().lower()
            
            if add_second in ['y', 'yes']:
                email2 = input("Enter email for User 2: ").strip()
                if not email2:
                    self.log("WARNING: No email provided for User 2, skipping", "WARNING")
                else:
                    password2 = input("Enter password for User 2: ").strip()
                    if not password2:
                        self.log("WARNING: No password provided for User 2, skipping", "WARNING")
                    else:
                        # Login second user
                        login_data = {
                            "email": email2,
                            "password": password2
                        }
                        
                        response = self.session.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
                        if response.status_code == 200:
                            data = response.json()
                            drf_token = data.get('token')
                            if drf_token:
                                self.jwt_tokens[email2] = drf_token
                                self.log(f"SUCCESS: Got DRF token for {email2}", "SUCCESS")
                            else:
                                self.log(f"ERROR: No token in response for {email2}", "ERROR")
                        else:
                            self.log(f"ERROR: Login failed for {email2} - Status: {response.status_code}", "ERROR")
            
            if not self.jwt_tokens:
                self.log("ERROR: No JWT tokens obtained", "ERROR")
                return False
                
            self.log(f"SUCCESS: Obtained {len(self.jwt_tokens)} DRF token(s)", "SUCCESS")
            return True
            
        except KeyboardInterrupt:
            self.log("Login interrupted by user", "INFO")
            return False
        except Exception as e:
            self.log(f"ERROR: Login failed - {str(e)}", "ERROR")
            return False
    
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
            self.log(f"SUCCESS {email}: Chat WebSocket connected and message sent", "SUCCESS")
            
            return websocket
        except Exception as e:
            self.log(f"ERROR {email}: Chat WebSocket failed - {str(e)}", "ERROR")
            return None
    
    async def test_notification_websocket(self, email):
        """Test notification WebSocket connection with JWT token"""
        if email not in self.jwt_tokens:
            self.log(f"ERROR {email}: No JWT token available", "ERROR")
            return None
            
        try:
            self.log(f"Connecting to notification WebSocket for {email}...")
            
            # Use JWT token in query string
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
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("WEBSOCKET TEST SUMMARY")
        print("="*60)
        
        print(f"WebSocket Connections: {len(self.websocket_connections)}")
        print(f"Messages Received: {len(self.received_messages)}")
        
        if self.received_messages:
            print("\nReceived Messages:")
            for conn_name, data in self.received_messages:
                print(f"  - {conn_name}: {data.get('type', 'unknown')}")
        
        print("="*60)

async def main():
    """Main test function"""
    print("Simple WebSocket Test with JWT Tokens")
    print("="*50)
    
    tester = SimpleWebSocketTester()
    
    try:
        # Step 1: Test Django server
        if not tester.test_django_server():
            print("ERROR: Django server is not running. Please start it first.")
            return
        
        # Step 2: Get JWT tokens
        print("\nStep 2: Getting JWT tokens...")
        if not tester.get_jwt_tokens():
            print("ERROR: Could not get JWT tokens. Please check credentials.")
            return
        
        # Step 3: Connect WebSockets
        print("\nStep 3: Connecting WebSockets...")
        for email in tester.jwt_tokens.keys():
            await tester.test_chat_websocket(email)
            await tester.test_notification_websocket(email)
        
        # Step 4: Create project
        print("\nStep 4: Creating project...")
        emails = list(tester.jwt_tokens.keys())
        if emails:
            project = tester.create_test_project(emails[0])
        
        # Step 5: Start listening for messages
        print("\nStep 5: Starting message listener...")
        listener_task = asyncio.create_task(tester.listen_for_messages(duration=15))
        
        # Step 6: Trigger events
        print("\nStep 6: Triggering events...")
        
        # Wait a moment for listener to start
        await asyncio.sleep(2)
        
        # Update project to trigger notifications
        if emails and 'project' in locals():
            tester.update_project(project['id'], emails[0])
        
        # Wait for listener to finish
        await listener_task
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nCritical error: {str(e)}")
    finally:
        await tester.cleanup()
        tester.print_summary()

if __name__ == "__main__":
    print("Simple WebSocket Test Script")
    print("="*50)
    print("This script tests WebSocket functionality with JWT tokens:")
    print("  - Django server connectivity")
    print("  - JWT token authentication")
    print("  - WebSocket connections (chat & notifications)")
    print("  - Project creation and broadcasting")
    print("  - Real-time message listening")
    print("="*50)
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
    
    print("\nStarting WebSocket test with JWT tokens...")
    asyncio.run(main())
