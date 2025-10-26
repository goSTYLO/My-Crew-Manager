# AI API Notification Testing Guide

This guide explains how to test the comprehensive notification system implemented in the AI API.

## 📁 Test Scripts

### 1. `setup_test_data.py` - Configuration Setup
**Purpose**: Get JWT tokens and user IDs needed for testing.

**Usage**:
```bash
python setup_test_data.py
```

**What it does**:
- Prompts for email/password of 2 users
- Gets JWT tokens for authentication
- Retrieves user IDs and names
- Generates configuration for `test_notifications.py`

### 2. `test_notifications.py` - Main Test Script
**Purpose**: Tests all notification endpoints by making API calls and verifying notifications are created.

**Usage**:
```bash
python test_notifications.py
```

**What it tests**:
- ✅ Project creation (no notification expected)
- ✅ Project invitation notifications
- ✅ Project update notifications
- ✅ Epic create/delete notifications
- ✅ Sub-epic create/delete notifications
- ✅ User story create/delete notifications
- ✅ Task assignment notifications
- ✅ Task completion notifications
- ✅ Repository CRUD notifications
- ✅ Backlog regeneration notifications
- ✅ Overview regeneration notifications

### 3. `check_notifications.py` - Database Checker
**Purpose**: Directly check notifications in the database for debugging.

**Usage**:
```bash
python check_notifications.py
```

**Features**:
- Check recent notifications (last 1-24 hours)
- Group notifications by type
- Check notifications for specific users
- Test database connectivity

## 🚀 Quick Start

### Step 1: Setup
1. Make sure your Django server is running on `localhost:8000`
2. Ensure you have at least 2 users in your database
3. **Optional**: Test authentication first:
   ```bash
   python test_auth.py
   ```
4. Run the setup script:
   ```bash
   python setup_test_data.py
   ```

### Step 2: Configure Test Script
1. Copy the generated configuration from `setup_test_data.py` output
2. Paste it into `test_notifications.py` (replace the `TEST_CONFIG` section)

### Step 3: Run Tests
```bash
python test_notifications.py
```

### Step 4: Debug (if needed)
If tests fail, use the database checker:
```bash
python check_notifications.py
```

## 📊 Expected Results

### Successful Test Run
```
🚀 Starting AI API Notification Tests
==================================================

📋 Project Creation
------------------------------
[12:34:56] ✓ Testing project creation...
[12:34:57] ✓ Created project with ID: 123
[12:34:58] ✓ No notifications created (expected for project creation)

📋 Project Invitation
------------------------------
[12:34:59] ✓ Testing project invitation...
[12:35:00] ✓ Created project invitation
[12:35:01] ✓ Found 1 notifications (expected ≥1): project invitation

... (more tests)

==================================================
📊 TEST SUMMARY
==================================================
Passed: 14/14
Success Rate: 100.0%
🎉 All tests passed!
```

### Database Check Results
```
🔍 Checking notifications from the last 24 hours...
============================================================
📊 Found 13 notifications:

🔔 Notification ID: 456
   Type: project_update
   Title: New Epic: Test Epic 123456
   Message: John Doe created a new epic in Test Project 123456
   Recipient: Jane Smith (jane@example.com)
   Actor: John Doe
   Created: 2024-01-15 12:35:02
   Read: No
   Content: epic (ID: 789)
   Action URL: /project-details/123
----------------------------------------
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Configuration not updated"
**Problem**: JWT tokens not set in `test_notifications.py`
**Solution**: Run `setup_test_data.py` and copy the generated config

#### 2. "Login failed: 404"
**Problem**: Authentication endpoint not found
**Solution**: 
- Check Django server is running on `localhost:8000`
- Verify the correct authentication endpoints:
  - Login: `POST /api/user/login/` (not `/api/auth/login/`)
  - User info: `GET /api/user/me/` (not `/api/auth/user/`)
  - Use `Token {token}` format (not `Bearer {token}`)

#### 3. "Failed to create project"
**Problem**: Authentication or server issues
**Solution**: 
- Check Django server is running
- Verify JWT tokens are valid
- Check user permissions

#### 4. "No notifications found"
**Problem**: Notifications not being created
**Solution**:
- Check Django logs for errors
- Use `check_notifications.py` to verify database
- Check `NotificationService` import in views.py

#### 5. "Database connection failed"
**Problem**: Django environment not set up
**Solution**:
- Make sure you're in the project root directory
- Check Django settings are correct
- Verify database is accessible

### Debug Steps

1. **Check Server Logs**:
   ```bash
   # Look for notification creation messages
   tail -f backend/logs/django.log | grep -i notification
   ```

2. **Check Database Directly**:
   ```sql
   -- Check recent notifications
   SELECT * FROM ai_api_notification 
   ORDER BY created_at DESC 
   LIMIT 10;
   
   -- Check notification types
   SELECT notification_type, COUNT(*) 
   FROM ai_api_notification 
   GROUP BY notification_type;
   ```

3. **Test Individual Endpoints**:
   Use Postman or curl to test specific endpoints:
   ```bash
   # Test project update
   curl -X PUT "http://localhost:8000/api/ai/projects/123/" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"title": "Updated Project"}'
   ```

## 📋 Notification Types Tested

| Type | Trigger | Recipients | Tested |
|------|---------|------------|--------|
| `project_invitation` | Invite user to project | Invited user | ✅ |
| `task_assigned` | Assign task to user | Assigned user | ✅ |
| `task_updated` | Update task details | Task assignee | ✅ |
| `task_completed` | Mark task as done | Task assignee | ✅ |
| `member_joined` | User joins project | All project members | ✅ |
| `member_left` | User leaves project | All project members | ✅ |
| `project_update` | Project/epic/story changes | All project members | ✅ |

## 🎯 Success Criteria

A successful test run should show:
- ✅ All 14 test cases pass
- ✅ Notifications created in database
- ✅ Proper notification types used
- ✅ Correct recipients targeted
- ✅ No authentication errors
- ✅ No server errors

## 📝 Notes

- Tests create real data in your database (projects, epics, etc.)
- Consider running tests on a development database
- Some tests may take longer (backlog/overview generation)
- Notifications are created asynchronously, so small delays are normal
- The test script cleans up by using unique timestamps in names

## 🔄 Running Tests Multiple Times

The test script uses timestamps to create unique names, so you can run it multiple times without conflicts. However, consider:

- Database will accumulate test data
- You may want to clean up test projects periodically
- JWT tokens may expire (run `setup_test_data.py` again if needed)
