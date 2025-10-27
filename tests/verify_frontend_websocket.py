#!/usr/bin/env python3
"""
Frontend WebSocket Verification Test

This script verifies that the frontend is properly using WebSocket
instead of polling for real-time updates.
"""

import asyncio
import json
import requests
import websockets
import time
from datetime import datetime

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
PROJECT_UPDATES_WEBSOCKET_URL = "ws://localhost:8000/ws/project-updates/"

class FrontendWebSocketVerifier:
    def __init__(self):
        self.auth_token = None
        self.user_id = None
        self.websocket_connections = {}
        self.received_messages = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def authenticate_user(self, email, password):
        """Authenticate user and get DRF token"""
        try:
            login_data = {"email": email, "password": password}
            response = requests.post(f"{DJANGO_BASE_URL}/api/user/login/", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.user_id = data.get('id')
                self.log(f"Authenticated user: {email} (ID: {self.user_id})", "SUCCESS")
                return True
            else:
                self.log(f"Authentication failed: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Authentication error: {e}", "ERROR")
            return False
    
    async def connect_project_updates_websocket(self):
        """Connect to project updates WebSocket"""
        if not self.auth_token:
            self.log("No auth token available", "ERROR")
            return None
            
        try:
            ws_url = f"{PROJECT_UPDATES_WEBSOCKET_URL}?token={self.auth_token}"
            self.log(f"Connecting to: {ws_url}")
            
            websocket = await websockets.connect(ws_url)
            self.websocket_connections['project_updates'] = websocket
            
            # Wait for connection confirmation
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(response)
                self.log(f"WebSocket connected: {data}", "SUCCESS")
                return websocket
            except asyncio.TimeoutError:
                self.log("No initial response received", "WARNING")
                return websocket
                
        except Exception as e:
            self.log(f"WebSocket connection failed: {e}", "ERROR")
            return None
    
    async def listen_for_messages(self, duration=10):
        """Listen for WebSocket messages for specified duration"""
        if 'project_updates' not in self.websocket_connections:
            self.log("No WebSocket connection available", "ERROR")
            return
        
        websocket = self.websocket_connections['project_updates']
        self.log(f"Listening for messages for {duration} seconds...")
        
        start_time = time.time()
        while time.time() - start_time < duration:
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                data = json.loads(message)
                self.received_messages.append({
                    'timestamp': datetime.now().isoformat(),
                    'data': data
                })
                self.log(f"Received message: {data}", "SUCCESS")
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                self.log(f"Error receiving message: {e}", "ERROR")
                break
    
    async def create_test_project(self):
        """Create a test project to trigger WebSocket events"""
        if not self.auth_token:
            self.log("No auth token available", "ERROR")
            return None
            
        try:
            headers = {"Authorization": f"Token {self.auth_token}"}
            project_data = {
                "title": f"Frontend WebSocket Test {int(time.time())}",
                "summary": "Testing frontend WebSocket integration",
                "description": "This project is created to test WebSocket broadcasting to the frontend"
            }
            
            response = requests.post(
                f"{DJANGO_BASE_URL}/api/ai/projects/",
                json=project_data,
                headers=headers
            )
            
            if response.status_code == 201:
                data = response.json()
                self.log(f"Created test project: {data.get('id')}", "SUCCESS")
                return data.get('id')
            else:
                self.log(f"Failed to create project: {response.status_code}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"Error creating project: {e}", "ERROR")
            return None
    
    async def cleanup(self):
        """Close all WebSocket connections"""
        for name, websocket in self.websocket_connections.items():
            try:
                await websocket.close()
                self.log(f"Closed {name} WebSocket", "SUCCESS")
            except Exception as e:
                self.log(f"Error closing {name} WebSocket: {e}", "ERROR")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("FRONTEND WEBSOCKET VERIFICATION SUMMARY")
        print("="*60)
        
        print(f"WebSocket Connections: {len(self.websocket_connections)}")
        print(f"Messages Received: {len(self.received_messages)}")
        
        if self.received_messages:
            print("\nReceived Messages:")
            for i, msg in enumerate(self.received_messages, 1):
                print(f"  {i}. {msg['timestamp']}: {msg['data']}")
        else:
            print("\nNo messages received - this could indicate:")
            print("  - Frontend is not connected to WebSocket")
            print("  - Polling is still active instead of WebSocket")
            print("  - WebSocket events are not being broadcast")
        
        print("\nExpected Frontend Console Messages:")
        print("  ✅ 'Project Updates WebSocket connected'")
        print("  ✅ 'WebSocket connected'")
        print("  ❌ Should NOT see: 'Starting notification polling'")
        print("  ❌ Should NOT see: 'Starting chat polling'")
        print("  ❌ Should NOT see: 'Tab visible, resuming polling'")
        
        print("\nTo verify frontend WebSocket integration:")
        print("  1. Open browser console")
        print("  2. Navigate to the application")
        print("  3. Look for WebSocket connection messages")
        print("  4. Verify no polling messages are present")
        print("="*60)

async def main():
    print("🔍 Frontend WebSocket Verification Test")
    print("="*50)
    
    verifier = FrontendWebSocketVerifier()
    
    try:
        # Step 1: Authenticate
        print("\n1. Authenticating user...")
        if not verifier.authenticate_user("adminaaron@gmail.com", "password123"):
            print("Authentication failed. Exiting.")
            return
        
        # Step 2: Connect to WebSocket
        print("\n2. Connecting to WebSocket...")
        websocket = await verifier.connect_project_updates_websocket()
        if not websocket:
            print("WebSocket connection failed. Exiting.")
            return
        
        # Step 3: Listen for messages while creating test events
        print("\n3. Testing WebSocket broadcasting...")
        
        # Start listening in background
        listen_task = asyncio.create_task(verifier.listen_for_messages(15))
        
        # Wait a moment for connection to stabilize
        await asyncio.sleep(2)
        
        # Create test project to trigger WebSocket event
        project_id = await verifier.create_test_project()
        
        # Wait for messages
        await listen_task
        
        # Step 4: Print summary
        verifier.print_summary()
        
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        await verifier.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
