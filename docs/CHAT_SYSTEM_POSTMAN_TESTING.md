# Chat System Postman Testing Guide

This guide provides comprehensive instructions for testing the Hybrid Chat System using Postman.

## Table of Contents

1. [Setup](#setup)
2. [Authentication](#authentication)
3. [REST API Testing](#rest-api-testing)
4. [WebSocket Testing](#websocket-testing)
5. [Test Scenarios](#test-scenarios)

## Setup

### Environment Setup

Create a new Postman Environment with the following variables:

```json
{
  "base_url": "http://localhost:8000",
  "ws_url": "ws://localhost:8000",
  "auth_token": "",
  "room_id": "",
  "user_id": ""
}
```

### Collection Setup

Create a new collection named "Chat System API" and configure:

1. Add the environment variables
2. Set up authentication header in collection's Authorization tab:
   ```
   Type: Bearer Token
   Token: {{auth_token}}
   ```

## Authentication

Before testing chat endpoints, you need to obtain an authentication token.

### Get Auth Token

```http
POST {{base_url}}/api/auth/token/
Content-Type: application/json

{
    "username": "your_username",
    "password": "your_password"
}
```

Save the token to your environment variable:

1. In Tests tab add:

```javascript
if (pm.response.code === 200) {
  pm.environment.set("auth_token", pm.response.json().token);
}
```

## REST API Testing

### 1. Room Management

#### List User's Rooms

```http
GET {{base_url}}/api/chat/rooms/
```

Expected Response (200 OK):

```json
[
  {
    "room_id": 1,
    "name": "Design Team",
    "is_private": true,
    "created_by_id": 5,
    "created_at": "2024-01-15T10:30:00Z",
    "members_count": 3
  }
]
```

#### Create New Room

```http
POST {{base_url}}/api/chat/rooms/
Content-Type: application/json

{
    "name": "New Project Team",
    "is_private": true
}
```

Expected Response (201 Created):

```json
{
  "room_id": 2,
  "name": "New Project Team",
  "is_private": true,
  "created_by_id": 5,
  "created_at": "2024-01-15T10:30:00Z",
  "members_count": 1
}
```

Save room_id in environment:

```javascript
if (pm.response.code === 201) {
  pm.environment.set("room_id", pm.response.json().room_id);
}
```

#### Get Room Details

```http
GET {{base_url}}/api/chat/rooms/{{room_id}}/
```

#### Invite User to Room

```http
POST {{base_url}}/api/chat/rooms/{{room_id}}/invite/
Content-Type: application/json

{
    "user_id": "{{user_id}}"
}
```

#### List Room Members

```http
GET {{base_url}}/api/chat/rooms/{{room_id}}/members/
```

#### Create/Get Direct Message Room

```http
POST {{base_url}}/api/chat/rooms/direct/
Content-Type: application/json

{
    "user_id": "{{user_id}}"
}
```

### 2. Message Management

#### Get Room Messages

```http
GET {{base_url}}/api/chat/rooms/{{room_id}}/messages/
```

Expected Response (200 OK):

```json
[
  {
    "message_id": 123,
    "room_id": 1,
    "sender_id": 5,
    "sender_username": "john_doe",
    "content": "Hello everyone!",
    "message_type": "text",
    "reply_to_id": null,
    "created_at": "2024-01-15T10:30:00Z",
    "edited_at": null,
    "is_deleted": false
  }
]
```

#### Send Message

```http
POST {{base_url}}/api/chat/rooms/{{room_id}}/messages/
Content-Type: application/json

{
    "content": "Hello everyone!",
    "message_type": "text",
    "reply_to_id": null
}
```

#### Delete Message

```http
DELETE {{base_url}}/api/chat/rooms/{{room_id}}/messages/{message_id}/
```

## WebSocket Testing

### 1. Room WebSocket Connection

To test WebSocket connections in Postman:

1. Create a new WebSocket Request
2. Set URL: `{{ws_url}}/ws/chat/{{room_id}}/`
3. Add connection headers:
   ```
   Authorization: Token {{auth_token}}
   ```

### 2. Real-time Events Testing

#### Send Typing Indicator

```json
{
  "type": "typing"
}
```

Expected Response:

```json
{
  "type": "typing",
  "user": "john_doe",
  "user_id": 5
}
```

#### Send Stop Typing

```json
{
  "type": "stop_typing"
}
```

Expected Response:

```json
{
  "type": "stop_typing",
  "user": "john_doe",
  "user_id": 5
}
```

### 3. Notifications WebSocket

1. Create a new WebSocket Request
2. Set URL: `{{ws_url}}/ws/chat/notifications/`
3. Add connection headers:
   ```
   Authorization: Token {{auth_token}}
   ```

You'll receive notifications like:

```json
{
  "type": "new_message_notification",
  "room_id": 1,
  "message": {
    "message_id": 123,
    "content": "Hello everyone!"
  },
  "sender": "john_doe"
}
```

## Test Scenarios

### 1. Complete Chat Flow

1. Get auth token
2. Create a new room
3. Invite another user
4. Connect to room's WebSocket
5. Send a message via REST API
6. Verify message appears in WebSocket stream
7. Send typing indicator
8. List room messages
9. Delete a message

### 2. Direct Message Flow

1. Create direct message room with another user
2. Connect to room's WebSocket
3. Send and receive messages
4. Test typing indicators

### 3. Room Management Flow

1. Create a new room
2. List all rooms
3. Add multiple members
4. List room members
5. Remove a member
6. Verify member removal notification

### 4. Error Cases Testing

1. Join non-existent room
2. Send message to room user isn't member of
3. Delete message user didn't create
4. Invite user to room without admin rights
5. Connect to WebSocket without authentication

## Validation

For each request, verify:

1. Status codes match expected values
2. Response structure matches schema
3. Real-time events are received when expected
4. Error messages are clear and actionable
5. Authentication and permissions are enforced

## Common Issues and Solutions

1. **WebSocket Connection Failed**

   - Verify auth token is valid
   - Check if user is room member
   - Ensure WebSocket URL is correct

2. **Auth Token Issues**

   - Token might be expired
   - Token format in header should be "Token <token>"
   - Refresh token if needed

3. **Room Access Denied**

   - Verify user is room member
   - Check if room exists
   - Validate user permissions

4. **Message Operations Failed**
   - Verify room_id is correct
   - Check message permissions
   - Validate message format

## AI Project Backlog Endpoint

This endpoint returns the project's backlog as a nested structure (epics -> sub_epics -> user_stories -> tasks).

Endpoint:

```http
GET {{base_url}}/api/ai/projects/{project_id}/backlog/
Authorization: Token {{auth_token}}
```

Example Response (200 OK):

```json
{
  "project_id": 1,
  "epics": [
    {
      "id": 10,
      "title": "Epic A",
      "description": "High-level description",
      "ai": true,
      "sub_epics": [
        {
          "id": 20,
          "title": "SubEpic A.1",
          "ai": true,
          "user_stories": [
            {
              "id": 30,
              "title": "User Story 1",
              "ai": true,
              "tasks": [
                {
                  "id": 40,
                  "title": "Task 1",
                  "status": "pending",
                  "ai": true
                },
                { "id": 41, "title": "Task 2", "status": "done", "ai": false }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Notes:

- The endpoint is implemented as a read-only action on `ProjectViewSet` and returns only persisted backlog items. If you call `generate-backlog` first, the generated items will be persisted and then returned here.
- If you need a paginated or filtered view (e.g. only epics with `ai=true`), I can add query params to support that.
