# 🔌 WebSocket Testing - Step by Step Guide

## Current Issue Analysis
- **WebSocket Error 1006**: Connection closed abnormally (usually authentication failure)
- **No Token in localStorage**: Need to authenticate first through the React app
- **Max Reconnection Attempts**: WebSocket keeps trying to reconnect without proper auth

## 🚀 Step-by-Step Solution

### Step 1: Access the React Application
1. Open your browser and go to: **http://localhost:5173**
2. You should see the My Crew Manager application

### Step 2: Create/Login to Get Authentication Token
1. **If you don't have an account:**
   - Click "Sign Up" or "Register"
   - Create a new account with email/password
   - Login with your new credentials

2. **If you have an account:**
   - Click "Login" 
   - Enter your email and password
   - Click "Sign In"

### Step 3: Verify Authentication Token
1. After successful login, open **Browser Developer Tools** (F12)
2. Go to **Application** tab → **Local Storage** → **http://localhost:5173**
3. Look for one of these keys:
   - `access` (JWT access token)
   - `token` (alternative token key)
4. **Copy the token value** - you'll need this for WebSocket testing

### Step 4: Test WebSocket Connection
1. Open the WebSocket test page: **simple_websocket_test.html**
2. Click **"Get Token from Storage"** button
3. The token should appear in the input field
4. Click **"Connect"** to establish WebSocket connection
5. Click **"Test Auth"** to send authentication message

### Step 5: Verify Real-time Functionality
1. In the main React app (http://localhost:5173):
   - Create a new project
   - Add some content (epics, tasks, etc.)
   - Make changes to see if they trigger real-time updates

2. In the WebSocket test page:
   - Watch the log for incoming messages
   - You should see real-time update messages

## 🔍 Troubleshooting

### If WebSocket Still Fails to Connect:

#### Check Django Server Status
```bash
# In terminal, verify Django is running
curl http://localhost:8000/api/ai/
# Should return API endpoints JSON
```

#### Check WebSocket URL
- The WebSocket URL should be: `ws://localhost:8000/ws/notifications/`
- Make sure Django server is running on port 8000

#### Check Authentication
- Token must be valid JWT format
- Token should not be expired
- User must be properly authenticated in Django

### If No Real-time Messages Appear:

#### Test API Endpoints First
1. In WebSocket test page, click **"Test API Connection"**
2. Should return successful response
3. Click **"Test Notifications"** 
4. Should return notifications data

#### Check Browser Console
1. Open Developer Tools → Console
2. Look for any JavaScript errors
3. Check for WebSocket connection messages

## 🎯 Expected Results

### Successful WebSocket Connection:
```
[6:23:17 AM] WebSocket connected successfully!
[6:23:17 AM] Authentication message sent
[6:23:17 AM] Received message: {"type":"notification","notification":{...}}
```

### Real-time Updates:
When you make changes in the React app, you should see messages like:
```json
{
  "type": "project_update",
  "payload": {
    "type": "project_update",
    "action": "updated",
    "project_id": 1,
    "data": {...},
    "actor": {"id": 1, "name": "User Name"}
  }
}
```

## 🚨 Common Issues & Solutions

### Issue: "No token found in localStorage"
**Solution**: Login to the React app first at http://localhost:5173

### Issue: "WebSocket error: [object Event]"
**Solution**: Check if Django server is running and WebSocket URL is correct

### Issue: "Token is invalid"
**Solution**: Re-login to get a fresh token, or check token format

### Issue: "Max reconnection attempts reached"
**Solution**: Fix authentication first, then reconnect

## 📱 Alternative Testing Method

If WebSocket testing is still problematic, you can test real-time functionality directly in the React app:

1. **Open Multiple Browser Windows**:
   - Window 1: http://localhost:5173 (User 1)
   - Window 2: http://localhost:5173 (User 2, incognito mode)

2. **Test Real-time Collaboration**:
   - Create project in Window 1
   - Invite User 2 to project
   - Make changes in Window 1
   - Verify changes appear in Window 2 instantly

3. **Check for Toast Notifications**:
   - Look for toast notifications in the UI
   - Verify they show actor information
   - Check that they appear for relevant events

## 🎉 Success Indicators

- ✅ WebSocket connects without errors
- ✅ Authentication message is accepted
- ✅ Real-time messages are received
- ✅ Changes in React app trigger WebSocket messages
- ✅ Toast notifications appear for real-time events
- ✅ Multiple users see updates instantly

---

**Next Steps**: Once WebSocket connection is working, we can proceed with comprehensive multi-user testing of the real-time collaboration features.
