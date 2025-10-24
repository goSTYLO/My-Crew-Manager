# Real-time WebSocket and Notification System - Manual Testing Guide

## 🎯 Testing Overview

This guide provides step-by-step instructions for manually testing the comprehensive real-time collaboration system described in the README. The system includes:

- **Real-time WebSocket Integration** - Live project updates across all team members
- **Notification System** - Instant notifications via WebSocket connections  
- **Toast Notifications** - Professional toast notifications with actor information
- **Multi-user Collaboration** - Real-time updates across multiple browser sessions

## 🚀 Prerequisites

### 1. Start the Servers
```bash
# Terminal 1: Start Django server
python manage.py runserver

# Terminal 2: Start React frontend
cd web
npm run dev
```

### 2. Verify Server Status
- **Django API**: http://localhost:8000/api/ai/ (should return API endpoints)
- **React App**: http://localhost:5173 (should show the application)
- **Django Admin**: http://localhost:8000/admin/ (for user management)

## 📋 Manual Testing Checklist

### Phase 1: Basic System Verification

#### ✅ 1.1 Frontend Accessibility
- [ ] Open http://localhost:5173 in browser
- [ ] Verify React app loads without errors
- [ ] Check browser console for any JavaScript errors
- [ ] Verify dark/light theme switching works

#### ✅ 1.2 User Authentication
- [ ] Create a new user account via signup
- [ ] Login with the new account
- [ ] Verify authentication token is stored in localStorage
- [ ] Check that protected routes require authentication

#### ✅ 1.3 WebSocket Connection
- [ ] Open browser Developer Tools → Network tab
- [ ] Look for WebSocket connection to `ws://localhost:8000/ws/notifications/`
- [ ] Verify connection status shows as "connected"
- [ ] Check browser console for WebSocket connection messages

### Phase 2: Single User Real-time Testing

#### ✅ 2.1 Project Creation
- [ ] Create a new project
- [ ] Verify project appears in projects list
- [ ] Check that project creator is automatically added as Owner member
- [ ] Verify project details page loads correctly

#### ✅ 2.2 Backlog Management
- [ ] Navigate to project details → Backlog tab
- [ ] Click "Edit" to enter edit mode
- [ ] Add a new epic manually
- [ ] Add a sub-epic under the epic
- [ ] Add a user story under the sub-epic
- [ ] Add a task under the user story
- [ ] Click "Save Changes" and verify data persists

#### ✅ 2.3 Task Assignment
- [ ] Assign a task to yourself (project creator)
- [ ] Verify task shows as assigned
- [ ] Mark task as complete with commit information
- [ ] Verify completion status updates

### Phase 3: Multi-User Collaboration Testing

#### ✅ 3.1 Setup Multiple Sessions
- [ ] Open second browser window/incognito tab
- [ ] Create second user account
- [ ] Login with second user
- [ ] Both users should be on the same project

#### ✅ 3.2 Project Invitation Flow
- [ ] From User 1: Send invitation to User 2
- [ ] From User 2: Check for invitation notification
- [ ] User 2: Accept invitation
- [ ] Verify User 2 becomes project member
- [ ] Check that both users can see the project

#### ✅ 3.3 Real-time Project Updates
- [ ] User 1: Make changes to project overview (title, summary, features)
- [ ] User 2: Verify changes appear instantly without page refresh
- [ ] User 2: Make changes to project details
- [ ] User 1: Verify changes appear instantly
- [ ] Check for toast notifications showing actor information

#### ✅ 3.4 Real-time Backlog Updates
- [ ] User 1: Add/edit/delete epic, sub-epic, user story, or task
- [ ] User 2: Verify changes appear instantly in backlog
- [ ] User 2: Make backlog changes
- [ ] User 1: Verify changes appear instantly
- [ ] Check for real-time toast notifications

#### ✅ 3.5 Real-time Task Assignment
- [ ] User 1: Assign task to User 2
- [ ] User 2: Verify task assignment notification appears
- [ ] User 2: Mark task as complete
- [ ] User 1: Verify task completion appears instantly
- [ ] Check for completion notifications

#### ✅ 3.6 Real-time Member Management
- [ ] User 1: Add new member to project
- [ ] All users: Verify member addition appears instantly
- [ ] User 1: Remove member from project
- [ ] All users: Verify member removal appears instantly
- [ ] Check for member change notifications

### Phase 4: AI Regeneration Testing

#### ✅ 4.1 Project Overview Regeneration
- [ ] User 1: Click "Regenerate Overview" 
- [ ] Verify confirmation modal appears
- [ ] Confirm regeneration
- [ ] Verify loading spinner with dynamic messages
- [ ] User 2: Verify regeneration notification appears
- [ ] Both users: Verify updated overview appears

#### ✅ 4.2 Backlog Regeneration
- [ ] User 1: Click "Regenerate Backlog"
- [ ] Verify confirmation modal appears
- [ ] Confirm regeneration
- [ ] Verify loading spinner with dynamic messages
- [ ] User 2: Verify regeneration notification appears
- [ ] Both users: Verify updated backlog appears

### Phase 5: Connection Resilience Testing

#### ✅ 5.1 WebSocket Reconnection
- [ ] Disconnect network connection
- [ ] Verify WebSocket shows "disconnected" status
- [ ] Reconnect network
- [ ] Verify WebSocket automatically reconnects
- [ ] Check browser console for reconnection messages

#### ✅ 5.2 Browser Tab Management
- [ ] Open project in multiple tabs
- [ ] Make changes in one tab
- [ ] Verify changes appear in other tabs
- [ ] Close and reopen tabs
- [ ] Verify WebSocket reconnects properly

### Phase 6: Toast Notification Testing

#### ✅ 6.1 Toast Types and Styling
- [ ] Trigger success operations (project creation, task completion)
- [ ] Verify green success toasts appear
- [ ] Trigger error operations (invalid input, API errors)
- [ ] Verify red error toasts appear
- [ ] Trigger warning operations (missing information)
- [ ] Verify yellow warning toasts appear
- [ ] Trigger info operations (feature announcements)
- [ ] Verify blue info toasts appear

#### ✅ 6.2 Toast Functionality
- [ ] Verify toasts auto-dismiss after 5 seconds
- [ ] Click X button to manually close toasts
- [ ] Verify toasts don't block user interaction
- [ ] Test toast behavior in both dark and light themes

#### ✅ 6.3 Real-time Toast Notifications
- [ ] User 1: Make project changes
- [ ] User 2: Verify real-time toast appears with actor information
- [ ] User 2: Make changes
- [ ] User 1: Verify real-time toast appears with actor information
- [ ] Check that toasts show correct user names and actions

### Phase 7: Performance and Edge Cases

#### ✅ 7.1 Multiple Concurrent Users
- [ ] Open project in 3+ browser windows with different users
- [ ] Make simultaneous changes from different users
- [ ] Verify all changes propagate correctly
- [ ] Check for any performance issues or conflicts

#### ✅ 7.2 Large Data Sets
- [ ] Create project with many epics, stories, and tasks
- [ ] Verify real-time updates work with large backlogs
- [ ] Check for any performance degradation

#### ✅ 7.3 Error Handling
- [ ] Test with invalid API responses
- [ ] Test with network interruptions
- [ ] Verify graceful error handling and user feedback
- [ ] Check that system recovers from errors

## 🔍 Browser Developer Tools Testing

### Network Tab Monitoring
1. **WebSocket Connection**:
   - Look for `ws://localhost:8000/ws/notifications/` connection
   - Verify connection status shows as "101 Switching Protocols"
   - Monitor WebSocket frames for real-time messages

2. **API Calls**:
   - Monitor XHR/Fetch requests to `/api/ai/` endpoints
   - Verify proper authentication headers
   - Check response times and status codes

### Console Monitoring
1. **WebSocket Messages**:
   ```javascript
   // Check WebSocket connection status
   console.log('WebSocket status:', window.websocketStatus);
   
   // Monitor real-time events
   // Look for messages like:
   // "Project updated:", "Task assigned:", "Member joined:", etc.
   ```

2. **Error Monitoring**:
   - Watch for JavaScript errors
   - Monitor WebSocket connection errors
   - Check for API call failures

### Application Tab (Chrome DevTools)
1. **Local Storage**:
   - Verify authentication tokens are stored
   - Check for any cached data

2. **Session Storage**:
   - Monitor real-time state management
   - Check for WebSocket connection data

## 📊 Expected Results

### ✅ Successful Test Indicators
- WebSocket connections establish and maintain
- Real-time updates appear instantly across all users
- Toast notifications show with correct actor information
- No JavaScript errors in browser console
- All API calls return successful status codes
- System handles network interruptions gracefully

### ❌ Failure Indicators
- WebSocket connection failures
- Delayed or missing real-time updates
- Missing toast notifications
- JavaScript errors in console
- API call failures (4xx, 5xx status codes)
- System crashes or freezes

## 🐛 Troubleshooting Common Issues

### WebSocket Connection Issues
- **Problem**: WebSocket fails to connect
- **Solution**: Check Django server is running, verify WebSocket URL, check authentication

### Missing Real-time Updates
- **Problem**: Changes don't appear in real-time
- **Solution**: Verify WebSocket connection, check browser console for errors, refresh page

### Authentication Issues
- **Problem**: API calls return 401 Unauthorized
- **Solution**: Check authentication token in localStorage, re-login if needed

### Toast Notifications Not Appearing
- **Problem**: No toast notifications for real-time events
- **Solution**: Check WebSocket connection, verify toast context is properly initialized

## 📝 Test Results Documentation

For each test phase, document:
- [ ] Test date and time
- [ ] Browser and version used
- [ ] Number of users tested
- [ ] Pass/fail status for each test
- [ ] Any issues encountered
- [ ] Screenshots of errors (if any)
- [ ] Performance observations

## 🎉 Success Criteria

The real-time system is considered successfully tested when:
- [ ] All Phase 1-7 tests pass
- [ ] WebSocket connections are stable
- [ ] Real-time updates work across multiple users
- [ ] Toast notifications appear correctly
- [ ] System handles edge cases gracefully
- [ ] No critical errors or crashes occur

---

**Note**: This testing should be performed before deploying the real-time collaboration features to production, as mentioned in the README's testing requirements section.
