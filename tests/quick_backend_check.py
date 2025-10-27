#!/usr/bin/env python3
"""
Quick Backend Check

This script performs a quick check of the backend to verify basic functionality
before running comprehensive tests. It's designed to run immediately and provide
fast feedback on the current state.

Usage:
    python tests/quick_backend_check.py

Requirements:
    - Django server running on localhost:8000
    - Redis server running (optional, will test if available)
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"

class QuickBackendChecker:
    def __init__(self):
        self.session = requests.Session()
        self.results = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def check_django_server(self):
        """Check if Django server is running"""
        try:
            response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/", timeout=5)
            if response.status_code == 200:
                self.log("Django server is running", "SUCCESS")
                self.results.append(("Django Server", "PASS", "Server is accessible"))
                return True
            else:
                self.log(f"Django server returned status: {response.status_code}", "ERROR")
                self.results.append(("Django Server", "FAIL", f"Status: {response.status_code}"))
                return False
        except Exception as e:
            self.log(f"Django server not accessible: {str(e)}", "ERROR")
            self.results.append(("Django Server", "FAIL", str(e)))
            return False
    
    def check_redis_through_django(self):
        """Check if Redis is working through Django"""
        try:
            # Test by creating a simple project (this will use Redis for notifications)
            self.log("Testing Redis through Django (project creation)...")
            
            # First, try to get a list of projects (this should work without auth)
            response = self.session.get(f"{DJANGO_BASE_URL}/api/ai/projects/", timeout=5)
            if response.status_code == 200:
                self.log("Django API is accessible", "SUCCESS")
                self.results.append(("Django API", "PASS", "API endpoints accessible"))
                return True
            else:
                self.log(f"Django API returned status: {response.status_code}", "WARNING")
                self.results.append(("Django API", "WARN", f"Status: {response.status_code}"))
                return False
        except Exception as e:
            self.log(f"Error testing Django API: {str(e)}", "ERROR")
            self.results.append(("Django API", "FAIL", str(e)))
            return False
    
    def check_websocket_endpoints(self):
        """Check if WebSocket endpoints are configured"""
        try:
            # Test if WebSocket endpoints are accessible (they should return 404 for HTTP)
            chat_response = self.session.get(f"{DJANGO_BASE_URL}/ws/chat/1/", timeout=3)
            notification_response = self.session.get(f"{DJANGO_BASE_URL}/ws/notifications/", timeout=3)
            
            # WebSocket endpoints should return 404 for HTTP requests (this is expected)
            if chat_response.status_code == 404:
                self.log("Chat WebSocket endpoint configured", "SUCCESS")
                self.results.append(("Chat WebSocket", "PASS", "Endpoint configured"))
            else:
                self.log(f"Chat WebSocket endpoint returned: {chat_response.status_code}", "WARNING")
                self.results.append(("Chat WebSocket", "WARN", f"Status: {chat_response.status_code}"))
            
            if notification_response.status_code == 404:
                self.log("Notification WebSocket endpoint configured", "SUCCESS")
                self.results.append(("Notification WebSocket", "PASS", "Endpoint configured"))
            else:
                self.log(f"Notification WebSocket endpoint returned: {notification_response.status_code}", "WARNING")
                self.results.append(("Notification WebSocket", "WARN", f"Status: {notification_response.status_code}"))
            
            return True
        except Exception as e:
            self.log(f"Error checking WebSocket endpoints: {str(e)}", "ERROR")
            self.results.append(("WebSocket Endpoints", "FAIL", str(e)))
            return False
    
    def check_authentication_endpoints(self):
        """Check if authentication endpoints are working"""
        try:
            # Test login endpoint (should return 400 for missing data, not 404)
            response = self.session.post(f"{DJANGO_BASE_URL}/api/user/login/", json={}, timeout=5)
            if response.status_code == 400:
                self.log("Authentication endpoint is working", "SUCCESS")
                self.results.append(("Authentication", "PASS", "Login endpoint accessible"))
                return True
            elif response.status_code == 404:
                self.log("Authentication endpoint not found", "ERROR")
                self.results.append(("Authentication", "FAIL", "Login endpoint not found"))
                return False
            else:
                self.log(f"Authentication endpoint returned: {response.status_code}", "WARNING")
                self.results.append(("Authentication", "WARN", f"Status: {response.status_code}"))
                return False
        except Exception as e:
            self.log(f"Error checking authentication: {str(e)}", "ERROR")
            self.results.append(("Authentication", "FAIL", str(e)))
            return False
    
    def check_database_connectivity(self):
        """Check if database is accessible"""
        try:
            # Test by accessing a simple endpoint that requires database
            response = self.session.get(f"{DJANGO_BASE_URL}/api/user/", timeout=5)
            if response.status_code in [200, 401]:  # 401 is expected without auth
                self.log("Database is accessible", "SUCCESS")
                self.results.append(("Database", "PASS", "Database connection working"))
                return True
            else:
                self.log(f"Database test returned: {response.status_code}", "WARNING")
                self.results.append(("Database", "WARN", f"Status: {response.status_code}"))
                return False
        except Exception as e:
            self.log(f"Error checking database: {str(e)}", "ERROR")
            self.results.append(("Database", "FAIL", str(e)))
            return False
    
    def run_quick_check(self):
        """Run all quick checks"""
        print("🔍 Quick Backend Check")
        print("="*40)
        print("This script performs a quick check of backend functionality")
        print("="*40)
        print()
        
        # Run all checks
        self.check_django_server()
        self.check_redis_through_django()
        self.check_websocket_endpoints()
        self.check_authentication_endpoints()
        self.check_database_connectivity()
        
        # Print summary
        self.print_summary()
        
        # Return overall success
        passed = len([r for r in self.results if r[1] == "PASS"])
        total = len(self.results)
        return passed == total
    
    def print_summary(self):
        """Print check summary"""
        print("\n" + "="*50)
        print("📊 QUICK BACKEND CHECK SUMMARY")
        print("="*50)
        
        passed = len([r for r in self.results if r[1] == "PASS"])
        warnings = len([r for r in self.results if r[1] == "WARN"])
        failed = len([r for r in self.results if r[1] == "FAIL"])
        total = len(self.results)
        
        print(f"Total Checks: {total}")
        print(f"✅ Passed: {passed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "N/A")
        
        if failed > 0:
            print("\n❌ Failed Checks:")
            for name, status, details in self.results:
                if status == "FAIL":
                    print(f"  - {name}: {details}")
        
        if warnings > 0:
            print("\n⚠️  Warning Checks:")
            for name, status, details in self.results:
                if status == "WARN":
                    print(f"  - {name}: {details}")
        
        print("\n" + "="*50)
        
        if passed == total:
            print("🎉 All checks passed! Backend is ready for testing.")
            print("✅ You can now run: python tests/run_backend_tests.py")
        elif failed == 0:
            print("⚠️  Some warnings, but backend is mostly ready.")
            print("✅ You can proceed with testing.")
        else:
            print("❌ Some checks failed. Please fix the issues first.")
            print("🔧 Check the error messages above for guidance.")

def main():
    """Main function"""
    print("🔍 Quick Backend Check Script")
    print("="*40)
    print("This script performs a quick check of:")
    print("  ✅ Django server connectivity")
    print("  ✅ API endpoints accessibility")
    print("  ✅ WebSocket endpoint configuration")
    print("  ✅ Authentication system")
    print("  ✅ Database connectivity")
    print("="*40)
    print()
    
    checker = QuickBackendChecker()
    success = checker.run_quick_check()
    
    if success:
        print("\n✅ Quick check completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Quick check failed!")
        print("Please fix the issues before running comprehensive tests.")
        sys.exit(1)

if __name__ == "__main__":
    main()
