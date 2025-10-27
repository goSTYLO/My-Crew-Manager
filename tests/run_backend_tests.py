#!/usr/bin/env python3
"""
Backend Test Runner

This script runs all backend tests in the correct order to verify
chat and notifications functionality before frontend testing.

Usage:
    python tests/run_backend_tests.py

Requirements:
    - Django server running on localhost:8000
    - Redis server running (or will attempt to start it)
"""

import subprocess
import sys
import time
import os
from pathlib import Path

class BackendTestRunner:
    def __init__(self):
        self.test_dir = Path("tests")
        self.results = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def run_script(self, script_name, description):
        """Run a test script and capture results"""
        self.log(f"Running {description}...")
        
        script_path = self.test_dir / script_name
        if not script_path.exists():
            self.log(f"Script not found: {script_path}", "ERROR")
            return False
        
        try:
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                timeout=60  # 1 minute timeout
            )
            
            if result.returncode == 0:
                self.log(f"✅ {description} completed successfully", "SUCCESS")
                self.results.append((script_name, "PASS", result.stdout))
                return True
            else:
                self.log(f"❌ {description} failed", "ERROR")
                self.log(f"Error output: {result.stderr}", "ERROR")
                self.results.append((script_name, "FAIL", result.stderr))
                return False
                
        except subprocess.TimeoutExpired:
            self.log(f"⏰ {description} timed out", "ERROR")
            self.results.append((script_name, "TIMEOUT", "Script timed out"))
            return False
        except Exception as e:
            self.log(f"❌ Error running {description}: {str(e)}", "ERROR")
            self.results.append((script_name, "ERROR", str(e)))
            return False
    
    def check_django_server(self):
        """Check if Django server is running"""
        try:
            import requests
            response = requests.get("http://localhost:8000/api/ai/", timeout=5)
            if response.status_code == 200:
                self.log("Django server is running", "SUCCESS")
                return True
            else:
                self.log(f"Django server returned status: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Django server not accessible: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("🚀 Backend Test Runner")
        print("="*50)
        print("This script will run all backend tests in sequence:")
        print("  1. Start Redis (if needed)")
        print("  2. Test Redis connectivity")
        print("  3. Test comprehensive backend functionality")
        print("  4. Test WebSocket broadcasting")
        print("="*50)
        print()
        
        # Check Django server first
        if not self.check_django_server():
            print("❌ Django server is not running. Please start it first:")
            print("   cd backend && python manage.py runserver")
            return False
        
        # Test 1: Start Redis
        self.log("Step 1: Starting Redis...")
        redis_started = self.run_script("start_redis.py", "Redis startup")
        
        if not redis_started:
            self.log("Redis startup failed, but continuing with tests...", "WARNING")
        
        # Test 2: Test Redis connectivity
        self.log("Step 2: Testing Redis connectivity...")
        redis_ok = self.run_script("test_redis_connectivity.py", "Redis connectivity")
        
        if not redis_ok:
            self.log("Redis connectivity test failed. WebSocket tests may not work.", "WARNING")
        
        # Test 3: Comprehensive backend test
        self.log("Step 3: Running comprehensive backend tests...")
        backend_ok = self.run_script("test_chat_notifications_backend.py", "Comprehensive backend test")
        
        # Test 4: WebSocket broadcasting test
        self.log("Step 4: Testing WebSocket broadcasting...")
        websocket_ok = self.run_script("test_websocket_broadcasting.py", "WebSocket broadcasting test")
        
        # Print summary
        self.print_summary()
        
        # Return overall success
        return redis_ok and backend_ok and websocket_ok
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 BACKEND TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r[1] == "PASS"])
        failed_tests = len([r for r in self.results if r[1] == "FAIL"])
        error_tests = len([r for r in self.results if r[1] in ["ERROR", "TIMEOUT"]])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️  Errors: {error_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
        
        if failed_tests > 0 or error_tests > 0:
            print("\n❌ Failed/Error Tests:")
            for script_name, status, output in self.results:
                if status in ["FAIL", "ERROR", "TIMEOUT"]:
                    print(f"  - {script_name}: {status}")
                    if output and len(output) < 200:
                        print(f"    Output: {output.strip()}")
        
        print("\n" + "="*60)
        
        if passed_tests == total_tests:
            print("🎉 All backend tests passed!")
            print("✅ Backend is ready for frontend testing")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
            print("❌ Backend may not be ready for frontend testing")

def main():
    """Main function"""
    print("🔍 Backend Test Runner")
    print("="*50)
    print("This script will run comprehensive backend tests to verify")
    print("chat and notifications functionality before frontend testing.")
    print("="*50)
    print()
    
    # Check if we're in the right directory
    if not Path("backend").exists():
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    if not Path("tests").exists():
        print("❌ Tests directory not found")
        sys.exit(1)
    
    runner = BackendTestRunner()
    success = runner.run_all_tests()
    
    if success:
        print("\n✅ Backend testing completed successfully!")
        print("You can now proceed with frontend testing.")
        sys.exit(0)
    else:
        print("\n❌ Backend testing failed!")
        print("Please fix the issues before proceeding with frontend testing.")
        sys.exit(1)

if __name__ == "__main__":
    main()
