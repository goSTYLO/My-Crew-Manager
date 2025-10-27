# Backend Test Scripts

This directory contains comprehensive test scripts for debugging backend chat and notifications functionality before frontend testing.

## 🚀 Quick Start

Run all tests in sequence:
```bash
python tests/run_backend_tests.py
```

## 📋 Individual Test Scripts

### 1. `start_redis.py`
**Purpose**: Start Redis server if not running
```bash
python tests/start_redis.py
```
- Checks for Redis files in `redis/` directory
- Starts Redis server if not running
- Verifies Redis connection
- Tests Django integration

### 2. `test_redis_connectivity.py`
**Purpose**: Test Redis connectivity through Django
```bash
python tests/test_redis_connectivity.py
```
- Tests Django server connectivity
- Authenticates a user
- Creates a project (triggers Redis usage)
- Tests notification API (Redis read)
- Tests chat API (Redis read)

### 3. `test_chat_notifications_backend.py`
**Purpose**: Comprehensive backend functionality test
```bash
python tests/test_chat_notifications_backend.py
```
- Creates test users
- Authenticates users
- Tests WebSocket connections (chat & notifications)
- Tests API endpoints
- Tests project creation and broadcasting
- Tests real-time message listening

### 4. `test_websocket_broadcasting.py`
**Purpose**: Interactive WebSocket broadcasting test
```bash
python tests/test_websocket_broadcasting.py
```
- Interactive script for testing WebSocket connections
- Tests chat message broadcasting
- Tests project update notifications
- Real-time message listening
- Requires user input for credentials

### 5. `run_backend_tests.py`
**Purpose**: Run all tests in sequence
```bash
python tests/run_backend_tests.py
```
- Orchestrates all test scripts
- Provides comprehensive test summary
- Determines if backend is ready for frontend testing

## 🔧 Prerequisites

### Required Services
1. **Django Server**: Must be running on `localhost:8000`
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Redis Server**: Must be running (scripts will attempt to start it)
   ```bash
   # Manual start
   cd redis
   ./redis-server.exe
   ```

### Required Users
- At least 2 users in the database
- Users should have valid credentials for authentication

## 📊 Test Results

### Success Indicators
- ✅ All WebSocket connections establish successfully
- ✅ Redis is accessible through Django
- ✅ Project creation and updates work
- ✅ Notifications are created and retrieved
- ✅ Chat messages are sent and received
- ✅ Real-time broadcasting works

### Failure Indicators
- ❌ WebSocket connection failures
- ❌ Redis connection errors
- ❌ Authentication failures
- ❌ API endpoint errors
- ❌ No real-time messages received

## 🐛 Troubleshooting

### Common Issues

#### 1. Redis Not Running
**Error**: `Redis connection failed`
**Solution**: 
```bash
python tests/start_redis.py
```

#### 2. Django Server Not Running
**Error**: `Django server not accessible`
**Solution**:
```bash
cd backend
python manage.py runserver
```

#### 3. Authentication Failures
**Error**: `Authentication failed`
**Solution**: 
- Check user credentials
- Ensure users exist in database
- Verify JWT token format

#### 4. WebSocket Connection Failures
**Error**: `WebSocket connection failed`
**Solution**:
- Check Django server is running
- Verify WebSocket URL is correct
- Check authentication tokens

#### 5. No Real-time Messages
**Error**: `No messages received`
**Solution**:
- Check Redis is running
- Verify project members are added
- Check WebSocket connections are active

## 📝 Test Output

### Console Output
Each test script provides detailed console output with:
- Timestamped log messages
- Success/failure indicators
- Error details and suggestions
- Test summaries

### Result Files
Some tests save detailed results to JSON files:
- `backend_test_results.json`: Comprehensive test results
- `realtime_test_results.json`: Real-time system test results

## 🎯 Next Steps

After successful backend testing:

1. **Start Frontend**: 
   ```bash
   cd web
   npm run dev
   ```

2. **Test Frontend Integration**:
   - Open browser to `http://localhost:5173`
   - Login with test users
   - Test real-time functionality
   - Verify WebSocket connections in browser dev tools

3. **Multi-User Testing**:
   - Open multiple browser windows
   - Login as different users
   - Test real-time collaboration
   - Verify notifications and chat work

## 📚 Additional Resources

- **WebSocket Testing**: `tests/WEBSOCKET_TESTING_STEPS.md`
- **Manual Testing**: `tests/MANUAL_TESTING_GUIDE.md`
- **Notification Testing**: `tests/NOTIFICATION_TESTING_README.md`

## 🔄 Running Tests Multiple Times

The test scripts are designed to be run multiple times:
- Use unique timestamps for test data
- Clean up test data automatically
- Handle existing users gracefully
- Provide consistent results

## ⚠️ Important Notes

- Tests create real data in your database
- Consider running on a development database
- Some tests may take longer (WebSocket listening)
- JWT tokens may expire (re-authenticate if needed)
- Redis must be running for WebSocket functionality
