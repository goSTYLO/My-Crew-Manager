#!/usr/bin/env python3
"""
Redis Startup Script

This script helps start Redis server on Windows if it's not already running.
It checks for Redis installation and starts the server.

Usage:
    python tests/start_redis.py

Requirements:
    - Redis server files in the redis/ directory
"""

import subprocess
import os
import sys
import time
import requests
from pathlib import Path

class RedisStarter:
    def __init__(self):
        self.redis_dir = Path("redis")
        self.redis_server_exe = self.redis_dir / "redis-server.exe"
        self.redis_cli_exe = self.redis_dir / "redis-cli.exe"
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def check_redis_files(self):
        """Check if Redis files exist"""
        if not self.redis_dir.exists():
            self.log(f"Redis directory not found: {self.redis_dir}", "ERROR")
            return False
        
        if not self.redis_server_exe.exists():
            self.log(f"Redis server executable not found: {self.redis_server_exe}", "ERROR")
            return False
        
        if not self.redis_cli_exe.exists():
            self.log(f"Redis CLI executable not found: {self.redis_cli_exe}", "ERROR")
            return False
        
        self.log("Redis files found", "SUCCESS")
        return True
    
    def check_redis_running(self):
        """Check if Redis is already running"""
        try:
            # Try to connect to Redis using the CLI
            result = subprocess.run(
                [str(self.redis_cli_exe), "ping"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0 and "PONG" in result.stdout:
                self.log("Redis is already running", "SUCCESS")
                return True
            else:
                self.log("Redis is not running", "INFO")
                return False
        except Exception as e:
            self.log(f"Error checking Redis status: {str(e)}", "WARNING")
            return False
    
    def start_redis_server(self):
        """Start Redis server"""
        try:
            self.log("Starting Redis server...")
            
            # Start Redis server in the background
            process = subprocess.Popen(
                [str(self.redis_server_exe)],
                cwd=str(self.redis_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait a moment for Redis to start
            time.sleep(3)
            
            # Check if process is still running
            if process.poll() is None:
                self.log("Redis server started successfully", "SUCCESS")
                return process
            else:
                stdout, stderr = process.communicate()
                self.log(f"Redis server failed to start: {stderr.decode()}", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"Error starting Redis server: {str(e)}", "ERROR")
            return None
    
    def verify_redis_connection(self):
        """Verify Redis is working by testing connection"""
        try:
            self.log("Verifying Redis connection...")
            
            result = subprocess.run(
                [str(self.redis_cli_exe), "ping"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0 and "PONG" in result.stdout:
                self.log("Redis connection verified", "SUCCESS")
                return True
            else:
                self.log(f"Redis connection failed: {result.stderr}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Error verifying Redis connection: {str(e)}", "ERROR")
            return False
    
    def test_django_redis_integration(self):
        """Test if Django can use Redis"""
        try:
            self.log("Testing Django-Redis integration...")
            
            # Test Django server
            response = requests.get("http://localhost:8000/api/ai/", timeout=5)
            if response.status_code == 200:
                self.log("Django server is accessible", "SUCCESS")
                return True
            else:
                self.log(f"Django server returned status: {response.status_code}", "WARNING")
                return False
        except Exception as e:
            self.log(f"Django server not accessible: {str(e)}", "WARNING")
            return False
    
    def run(self):
        """Run the Redis startup process"""
        print("🔴 Redis Startup Script")
        print("="*40)
        
        # Step 1: Check Redis files
        if not self.check_redis_files():
            print("\n❌ Redis files not found. Please ensure Redis is installed in the redis/ directory.")
            return False
        
        # Step 2: Check if Redis is already running
        if self.check_redis_running():
            print("\n✅ Redis is already running!")
            return True
        
        # Step 3: Start Redis server
        process = self.start_redis_server()
        if not process:
            print("\n❌ Failed to start Redis server.")
            return False
        
        # Step 4: Verify connection
        if not self.verify_redis_connection():
            print("\n❌ Redis connection verification failed.")
            return False
        
        # Step 5: Test Django integration
        self.test_django_redis_integration()
        
        print("\n✅ Redis startup completed successfully!")
        print("You can now run the WebSocket tests.")
        return True

def main():
    """Main function"""
    print("🔍 Redis Startup Script")
    print("="*40)
    print("This script will:")
    print("  ✅ Check for Redis files")
    print("  ✅ Check if Redis is already running")
    print("  ✅ Start Redis server if needed")
    print("  ✅ Verify Redis connection")
    print("  ✅ Test Django integration")
    print("="*40)
    print()
    
    starter = RedisStarter()
    success = starter.run()
    
    if success:
        print("\n🎉 Redis is ready for testing!")
        sys.exit(0)
    else:
        print("\n❌ Redis startup failed!")
        print("Please check your Redis installation and try again.")
        sys.exit(1)

if __name__ == "__main__":
    main()
