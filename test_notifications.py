#!/usr/bin/env python3
"""
Test script for AI API notification endpoints.
This script tests all notification types by making API calls and verifying notifications are created.

Usage:
    python test_notifications.py

Requirements:
    - Django server running on localhost:8000
    - At least 2 users in the database
    - Authentication tokens for testing
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/ai"

# Test data - Real values from your database
TEST_CONFIG = {
    "user1_token": "039158d9bb4842081e9c5fe29bb72944dec0a62b",  # adminaaron@gmail.com
    "user2_token": "b3c1a6e61db69898a7c6e3b6eb0d0a982fcd6317",  # wow@gmail.com
    "user1_id": 14,  # Aaron Tamayo
    "user2_id": 19,  # WOWOW WOWOW
    "project_id": None,  # Will be set after project creation
    "epic_id": None,  # Will be set after epic creation
    "sub_epic_id": None,  # Will be set after sub-epic creation
    "user_story_id": None,  # Will be set after user story creation
    "task_id": None,  # Will be set after task creation
    "repository_id": None,  # Will be set after repository creation
}

class NotificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.results = []
        
    def log(self, message, success=True):
        """Log test results"""
        status = "✓" if success else "✗"
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status} {message}")
        self.results.append({
            "timestamp": timestamp,
            "success": success,
            "message": message
        })
    
    def make_request(self, method, endpoint, data=None, token=None, files=None):
        """Make authenticated API request"""
        url = f"{API_BASE}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Token {token}" if token else None
        }
        
        if files:
            headers.pop("Content-Type")  # Let requests set multipart boundary
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                if files:
                    response = self.session.post(url, headers=headers, data=data, files=files)
                else:
                    response = self.session.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except Exception as e:
            self.log(f"Request failed: {e}", False)
            return None
    
    def check_notifications(self, user_token, expected_count=1, description=""):
        """Check if notifications were created for a user"""
        response = self.make_request("GET", "/notifications/", token=user_token)
        if not response or response.status_code != 200:
            self.log(f"Failed to fetch notifications: {description}", False)
            return False
        
        notifications = response.json()
        actual_count = len(notifications)
        
        if actual_count >= expected_count:
            self.log(f"Found {actual_count} notifications (expected ≥{expected_count}): {description}")
            return True
        else:
            self.log(f"Only found {actual_count} notifications (expected ≥{expected_count}): {description}", False)
            return False
    
    def check_user2_notifications(self, expected_count=1, description=""):
        """Check notifications specifically for user2 (wow@gmail.com)"""
        return self.check_notifications(TEST_CONFIG["user2_token"], expected_count, f"wow@gmail.com - {description}")
    
    def test_project_creation(self):
        """Test project creation and add user2 as project member"""
        self.log("Testing project creation...")
        
        data = {
            "title": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "summary": "Test project for notification testing"
        }
        
        response = self.make_request("POST", "/projects/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create project", False)
            return False
        
        project_data = response.json()
        TEST_CONFIG["project_id"] = project_data["id"]
        self.log(f"Created project with ID: {TEST_CONFIG['project_id']}")
        
        # Add user2 as a project member so they can receive notifications
        member_data = {
            "project": TEST_CONFIG["project_id"],
            "user": TEST_CONFIG["user2_id"],
            "role": "developer"
        }
        
        response = self.make_request("POST", "/project-members/", data=member_data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to add user2 as project member", False)
            return False
        
        self.log("Added user2 as project member")
        
        # Check that no notifications were created for project creation (expected)
        time.sleep(1)  # Wait for async operations
        self.log("No notifications expected for project creation (user2 not yet invited)")
        
        return True
    
    def test_project_invitation(self):
        """Test project invitation notification"""
        self.log("Testing project invitation...")
        
        data = {
            "project": TEST_CONFIG["project_id"],
            "invitee": TEST_CONFIG["user2_id"],
            "message": "Join our test project!"
        }
        
        response = self.make_request("POST", "/invitations/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create project invitation", False)
            return False
        
        self.log("Created project invitation")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(1, "project invitation")
    
    def test_project_update(self):
        """Test project update notification"""
        self.log("Testing project update...")
        
        data = {
            "title": f"Updated Test Project {datetime.now().strftime('%H%M%S')}",
            "summary": "Updated test project summary"
        }
        
        response = self.make_request("PUT", f"/projects/{TEST_CONFIG['project_id']}/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 200:
            self.log("Failed to update project", False)
            return False
        
        self.log("Updated project")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(2, "project update")
    
    def test_epic_creation(self):
        """Test epic creation notification"""
        self.log("Testing epic creation...")
        
        data = {
            "project": TEST_CONFIG["project_id"],
            "title": f"Test Epic {datetime.now().strftime('%H%M%S')}",
            "description": "Test epic for notification testing"
        }
        
        response = self.make_request("POST", "/epics/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create epic", False)
            return False
        
        epic_data = response.json()
        TEST_CONFIG["epic_id"] = epic_data["id"]
        self.log(f"Created epic with ID: {TEST_CONFIG['epic_id']}")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(3, "epic creation")
    
    def test_epic_deletion(self):
        """Test epic deletion notification"""
        self.log("Testing epic deletion...")
        
        response = self.make_request("DELETE", f"/epics/{TEST_CONFIG['epic_id']}/", token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 204:
            self.log("Failed to delete epic", False)
            return False
        
        self.log("Deleted epic")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(4, "epic deletion")
    
    def test_sub_epic_creation(self):
        """Test sub-epic creation notification"""
        self.log("Testing sub-epic creation...")
        
        # First create a new epic for the sub-epic
        epic_data = {
            "project": TEST_CONFIG["project_id"],
            "title": f"Parent Epic {datetime.now().strftime('%H%M%S')}",
            "description": "Parent epic for sub-epic testing"
        }
        
        response = self.make_request("POST", "/epics/", data=epic_data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create parent epic", False)
            return False
        
        parent_epic_id = response.json()["id"]
        
        # Now create sub-epic
        data = {
            "epic": parent_epic_id,
            "title": f"Test Sub-Epic {datetime.now().strftime('%H%M%S')}"
        }
        
        response = self.make_request("POST", "/sub-epics/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create sub-epic", False)
            return False
        
        sub_epic_data = response.json()
        TEST_CONFIG["sub_epic_id"] = sub_epic_data["id"]
        self.log(f"Created sub-epic with ID: {TEST_CONFIG['sub_epic_id']}")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(5, "sub-epic creation")
    
    def test_user_story_creation(self):
        """Test user story creation notification"""
        self.log("Testing user story creation...")
        
        data = {
            "sub_epic": TEST_CONFIG["sub_epic_id"],
            "title": f"Test User Story {datetime.now().strftime('%H%M%S')}"
        }
        
        response = self.make_request("POST", "/user-stories/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create user story", False)
            return False
        
        user_story_data = response.json()
        TEST_CONFIG["user_story_id"] = user_story_data["id"]
        self.log(f"Created user story with ID: {TEST_CONFIG['user_story_id']}")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(6, "user story creation")
    
    def test_task_creation_and_assignment(self):
        """Test task creation and assignment notification"""
        self.log("Testing task creation and assignment...")
        
        data = {
            "user_story": TEST_CONFIG["user_story_id"],
            "title": f"Test Task {datetime.now().strftime('%H%M%S')}",
            "status": "pending"
        }
        
        response = self.make_request("POST", "/story-tasks/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create task", False)
            return False
        
        task_data = response.json()
        TEST_CONFIG["task_id"] = task_data["id"]
        self.log(f"Created task with ID: {TEST_CONFIG['task_id']}")
        
        # Now assign the task to user2 (this should create a notification)
        # First, we need to get the project member ID for user2
        members_response = self.make_request("GET", f"/project-members/?project_id={TEST_CONFIG['project_id']}", token=TEST_CONFIG["user1_token"])
        if not members_response or members_response.status_code != 200:
            self.log("Failed to fetch project members", False)
            return False
        
        members = members_response.json()
        user2_member_id = None
        for member in members:
            if member["user"] == TEST_CONFIG["user2_id"]:
                user2_member_id = member["id"]
                break
        
        if not user2_member_id:
            self.log("User2 not found in project members", False)
            return False
        
        # Assign task to user2
        assign_data = {
            "assignee": user2_member_id
        }
        
        response = self.make_request("PUT", f"/story-tasks/{TEST_CONFIG['task_id']}/", data=assign_data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 200:
            self.log("Failed to assign task", False)
            return False
        
        self.log("Assigned task to user2")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(7, "task assignment")
    
    def test_task_completion(self):
        """Test task completion notification"""
        self.log("Testing task completion...")
        
        data = {
            "status": "done",
            "commit_title": f"Completed test task {datetime.now().strftime('%H%M%S')}",
            "commit_branch": "main"
        }
        
        response = self.make_request("PUT", f"/story-tasks/{TEST_CONFIG['task_id']}/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 200:
            self.log("Failed to complete task", False)
            return False
        
        self.log("Completed task")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(8, "task completion")
    
    def test_repository_creation(self):
        """Test repository creation notification"""
        self.log("Testing repository creation...")
        
        data = {
            "project": TEST_CONFIG["project_id"],
            "name": f"test-repo-{datetime.now().strftime('%H%M%S')}",
            "url": "https://github.com/test/test-repo.git",
            "branch": "main"
        }
        
        response = self.make_request("POST", "/repositories/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 201:
            self.log("Failed to create repository", False)
            return False
        
        repo_data = response.json()
        TEST_CONFIG["repository_id"] = repo_data["id"]
        self.log(f"Created repository with ID: {TEST_CONFIG['repository_id']}")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(9, "repository creation")
    
    def test_repository_update(self):
        """Test repository update notification"""
        self.log("Testing repository update...")
        
        data = {
            "name": f"updated-test-repo-{datetime.now().strftime('%H%M%S')}",
            "url": "https://github.com/test/updated-test-repo.git"
        }
        
        response = self.make_request("PUT", f"/repositories/{TEST_CONFIG['repository_id']}/", data=data, token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 200:
            self.log("Failed to update repository", False)
            return False
        
        self.log("Updated repository")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(10, "repository update")
    
    def test_repository_deletion(self):
        """Test repository deletion notification"""
        self.log("Testing repository deletion...")
        
        response = self.make_request("DELETE", f"/repositories/{TEST_CONFIG['repository_id']}/", token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 204:
            self.log("Failed to delete repository", False)
            return False
        
        self.log("Deleted repository")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(1)
        return self.check_user2_notifications(11, "repository deletion")
    
    def test_backlog_regeneration(self):
        """Test backlog regeneration notification"""
        self.log("Testing backlog regeneration...")
        
        # First create a proposal for the project
        proposal_data = {
            "project_id": TEST_CONFIG["project_id"]
        }
        
        # Create a simple test PDF content
        test_pdf_content = b"Test project proposal content for backlog generation testing."
        
        files = {
            "file": ("test_proposal.pdf", test_pdf_content, "application/pdf")
        }
        
        response = self.make_request("POST", "/proposals/", data=proposal_data, token=TEST_CONFIG["user1_token"], files=files)
        if not response or response.status_code != 201:
            self.log("Failed to create proposal", False)
            return False
        
        self.log("Created test proposal")
        
        # Now regenerate backlog
        response = self.make_request("PUT", f"/projects/{TEST_CONFIG['project_id']}/generate-backlog/", token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 200:
            self.log("Failed to regenerate backlog", False)
            return False
        
        self.log("Regenerated backlog")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(2)  # Backlog generation takes longer
        return self.check_user2_notifications(12, "backlog regeneration")
    
    def test_overview_regeneration(self):
        """Test overview regeneration notification"""
        self.log("Testing overview regeneration...")
        
        response = self.make_request("PUT", f"/projects/{TEST_CONFIG['project_id']}/generate-overview/", token=TEST_CONFIG["user1_token"])
        if not response or response.status_code != 200:
            self.log("Failed to regenerate overview", False)
            return False
        
        self.log("Regenerated overview")
        
        # Check that notification was created for user2 (wow@gmail.com)
        time.sleep(2)  # Overview generation takes longer
        return self.check_user2_notifications(13, "overview regeneration")
    
    def run_all_tests(self):
        """Run all notification tests"""
        print("🚀 Starting AI API Notification Tests")
        print("🎯 Testing notifications for wow@gmail.com (user2)")
        print("=" * 50)
        
        # Check if configuration is set
        if TEST_CONFIG["user1_token"] == "your_jwt_token_here":
            self.log("❌ Please update TEST_CONFIG with real JWT tokens and user IDs", False)
            return False
        
        tests = [
            ("Project Creation", self.test_project_creation),
            ("Project Invitation", self.test_project_invitation),
            ("Project Update", self.test_project_update),
            ("Epic Creation", self.test_epic_creation),
            ("Epic Deletion", self.test_epic_deletion),
            ("Sub-Epic Creation", self.test_sub_epic_creation),
            ("User Story Creation", self.test_user_story_creation),
            ("Task Assignment", self.test_task_creation_and_assignment),
            ("Task Completion", self.test_task_completion),
            ("Repository Creation", self.test_repository_creation),
            ("Repository Update", self.test_repository_update),
            ("Repository Deletion", self.test_repository_deletion),
            ("Backlog Regeneration", self.test_backlog_regeneration),
            ("Overview Regeneration", self.test_overview_regeneration),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 {test_name}")
            print("-" * 30)
            try:
                if test_func():
                    passed += 1
                else:
                    self.log(f"Test failed: {test_name}", False)
            except Exception as e:
                self.log(f"Test error: {test_name} - {e}", False)
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("🎉 All tests passed!")
        else:
            print(f"❌ {total - passed} tests failed")
        
        return passed == total

def main():
    """Main function"""
    print("AI API Notification Test Script")
    print("🎯 Focus: Testing notifications for wow@gmail.com")
    print("=" * 50)
    print()
    print("⚠️  IMPORTANT: Update TEST_CONFIG in this script with:")
    print("   - Real JWT tokens for user1 and user2")
    print("   - Real user IDs for user1 and user2")
    print("   - Make sure Django server is running on localhost:8000")
    print("   - Ensure both users exist in the database")
    print("   - user1 performs actions, user2 (wow@gmail.com) receives notifications")
    print()
    
    # Check if config is updated
    if TEST_CONFIG["user1_token"] == "your_jwt_token_here":
        print("❌ Configuration not updated. Please edit TEST_CONFIG in the script.")
        sys.exit(1)
    
    # Run tests
    tester = NotificationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ All notification tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
