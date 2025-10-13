# Hybrid Chat System: REST API + WebSocket

This document describes the hybrid chat system that combines REST APIs for data operations with WebSocket connections for real-time updates.

## Architecture Overview

### 🏗️ **System Design**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Django        │    │   Redis         │
│   (Flutter/Web) │    │   Backend       │    │   Channel Layer │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼───┐              ┌────▼────┐
    │ REST API│              │ ASGI  │              │ Channel │
    │ Requests│              │ Server│              │ Layers  │
    └─────────┘              └───┬───┘              └─────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼───┐              ┌────▼────┐
    │ Data    │              │ WebSocket│           │ Real-time│
    │ Persistence│           │ Consumers│           │ Events   │
    └─────────┘              └─────────┘            └─────────┘
```

### 📋 **Responsibilities**

| Component          | Purpose                               | Technology            |
| ------------------ | ------------------------------------- | --------------------- |
| **REST API**       | Data operations, persistence, history | Django REST Framework |
| **WebSocket**      | Real-time events, typing indicators   | Django Channels       |
| **Channel Layers** | Message broadcasting                  | Redis                 |

## API Endpoints

### 🔗 **REST API Endpoints**

#### **Base URL**: `/api/chat/`

#### **Authentication**: Token-based

```http
Authorization: Token <your_token>
```

### **Rooms**

| Method   | Endpoint                              | Description                    |
| -------- | ------------------------------------- | ------------------------------ |
| `GET`    | `/api/chat/rooms/`                    | List user's rooms              |
| `POST`   | `/api/chat/rooms/`                    | Create new room                |
| `GET`    | `/api/chat/rooms/{id}/`               | Get room details               |
| `PATCH`  | `/api/chat/rooms/{id}/`               | Update room                    |
| `DELETE` | `/api/chat/rooms/{id}/`               | Delete room                    |
| `POST`   | `/api/chat/rooms/{id}/invite/`        | Invite user to room            |
| `POST`   | `/api/chat/rooms/{id}/remove_member/` | Remove user from room          |
| `GET`    | `/api/chat/rooms/{id}/members/`       | List room members              |
| `POST`   | `/api/chat/rooms/direct/`             | Create/get direct message room |

### **Messages**

| Method   | Endpoint                              | Description       |
| -------- | ------------------------------------- | ----------------- |
| `GET`    | `/api/chat/rooms/{id}/messages/`      | Get room messages |
| `POST`   | `/api/chat/rooms/{id}/messages/`      | Send message      |
| `DELETE` | `/api/chat/rooms/{id}/messages/{id}/` | Delete message    |

### **WebSocket Endpoints**

| Endpoint                                     | Purpose               |
| -------------------------------------------- | --------------------- |
| `ws://localhost:8000/ws/chat/{room_id}/`     | Real-time room events |
| `ws://localhost:8000/ws/chat/notifications/` | Global notifications  |

## Data Models

### **Room Model**

```json
{
  "room_id": 1,
  "name": "Design Team",
  "is_private": true,
  "created_by_id": 5,
  "created_at": "2024-01-15T10:30:00Z",
  "members_count": 3
}
```

### **Message Model**

```json
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
```

### **Membership Model**

```json
{
  "membership_id": 1,
  "room_id": 1,
  "user_id": 5,
  "is_admin": true,
  "joined_at": "2024-01-15T10:30:00Z"
}
```

## Real-time Events

### **WebSocket Message Types**

#### **Client → Server (Room Events)**

```json
{
  "type": "typing"
}

{
  "type": "stop_typing"
}
```

#### **Server → Client (Real-time Events)**

**New Message**

```json
{
  "type": "new_message",
  "message": {
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
  },
  "sender": "john_doe",
  "sender_id": 5
}
```

**Typing Indicators**

```json
{
  "type": "typing",
  "user": "john_doe",
  "user_id": 5
}

{
  "type": "stop_typing",
  "user": "john_doe",
  "user_id": 5
}
```

**User Presence**

```json
{
  "type": "user_joined",
  "user": "jane_doe",
  "user_id": 6
}

{
  "type": "user_left",
  "user": "jane_doe",
  "user_id": 6
}
```

**Room Events**

```json
{
  "type": "room_created",
  "room": { /* room object */ },
  "created_by": "admin_user"
}

{
  "type": "user_invited",
  "user_id": 6,
  "invited_by": "admin_user"
}

{
  "type": "user_removed",
  "user_id": 6,
  "removed_by": "admin_user"
}

{
  "type": "message_deleted",
  "message_id": 123,
  "deleted_by": "john_doe"
}
```

**Notifications**

```json
{
  "type": "new_message_notification",
  "room_id": 1,
  "message": { /* message object */ },
  "sender": "john_doe"
}

{
  "type": "room_invitation",
  "room_id": 1,
  "room_name": "Design Team",
  "invited_by": "admin_user"
}
```

## Usage Examples

### **1. Complete Chat Flow**

#### **Step 1: Get User's Rooms**

```http
GET /api/chat/rooms/
Authorization: Token <token>
```

#### **Step 2: Connect to Room WebSocket**

```javascript
const socket = new WebSocket("ws://localhost:8000/ws/chat/1/");
```

#### **Step 3: Load Room Messages**

```http
GET /api/chat/rooms/1/messages/
Authorization: Token <token>
```

#### **Step 4: Send Message via REST API**

```http
POST /api/chat/rooms/1/messages/
Authorization: Token <token>
Content-Type: application/json

{
  "content": "Hello everyone!",
  "message_type": "text",
  "reply_to_id": null
}
```

#### **Step 5: Receive Real-time Updates via WebSocket**

```javascript
socket.onmessage = function (event) {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case "new_message":
      displayMessage(data.message);
      break;
    case "typing":
      showTypingIndicator(data.user);
      break;
    case "stop_typing":
      hideTypingIndicator(data.user);
      break;
  }
};
```

### **2. Room Management**

#### **Create Room**

```http
POST /api/chat/rooms/
Authorization: Token <token>
Content-Type: application/json

{
  "name": "Design Team",
  "is_private": true
}
```

#### **Invite User**

```http
POST /api/chat/rooms/1/invite/
Authorization: Token <token>
Content-Type: application/json

{
  "user_id": 6
}
```

#### **Get Room Members**

```http
GET /api/chat/rooms/1/members/
Authorization: Token <token>
```

### **3. Direct Messages**

#### **Create/Get Direct Message Room**

```http
POST /api/chat/rooms/direct/
Authorization: Token <token>
Content-Type: application/json

{
  "user_id": 6
}
```

## Frontend Integration

### **JavaScript/TypeScript Example**

```javascript
class ChatManager {
  constructor(roomId, token) {
    this.roomId = roomId;
    this.token = token;
    this.socket = null;
    this.baseUrl = "http://localhost:8000/api/chat";
  }

  // REST API Methods
  async getRooms() {
    const response = await fetch(`${this.baseUrl}/rooms/`, {
      headers: { Authorization: `Token ${this.token}` },
    });
    return response.json();
  }

  async getMessages(limit = 50, offset = 0) {
    const response = await fetch(
      `${this.baseUrl}/rooms/${this.roomId}/messages/?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Token ${this.token}` },
      }
    );
    return response.json();
  }

  async sendMessage(content, messageType = "text", replyToId = null) {
    const response = await fetch(
      `${this.baseUrl}/rooms/${this.roomId}/messages/`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          message_type: messageType,
          reply_to_id: replyToId,
        }),
      }
    );
    return response.json();
  }

  async deleteMessage(messageId) {
    const response = await fetch(
      `${this.baseUrl}/rooms/${this.roomId}/messages/${messageId}/`,
      {
        method: "DELETE",
        headers: { Authorization: `Token ${this.token}` },
      }
    );
    return response.status === 204;
  }

  // WebSocket Methods
  connectWebSocket() {
    this.socket = new WebSocket(`ws://localhost:8000/ws/chat/${this.roomId}/`);

    this.socket.onopen = () => {
      console.log("Connected to chat room");
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeEvent(data);
    };
  }

  handleRealtimeEvent(data) {
    switch (data.type) {
      case "new_message":
        this.displayMessage(data.message);
        break;
      case "typing":
        this.showTypingIndicator(data.user);
        break;
      case "stop_typing":
        this.hideTypingIndicator(data.user);
        break;
      case "user_joined":
        this.showUserJoined(data.user);
        break;
      case "user_left":
        this.showUserLeft(data.user);
        break;
    }
  }

  // Typing indicators
  startTyping() {
    if (this.socket) {
      this.socket.send(JSON.stringify({ type: "typing" }));
    }
  }

  stopTyping() {
    if (this.socket) {
      this.socket.send(JSON.stringify({ type: "stop_typing" }));
    }
  }
}
```

## Benefits of Hybrid Approach

### ✅ **Advantages**

1. **Separation of Concerns**

   - REST API handles data persistence and business logic
   - WebSocket handles real-time events only

2. **Better Performance**

   - REST API for heavy data operations
   - WebSocket for lightweight real-time events

3. **Easier Debugging**

   - Clear separation between data operations and real-time events
   - Standard HTTP status codes for API responses

4. **Scalability**

   - REST API can be cached and load-balanced
   - WebSocket connections can be distributed

5. **Offline Support**

   - REST API responses can be cached
   - WebSocket reconnection handles network issues

6. **Testing**
   - REST API endpoints are easy to test
   - WebSocket events can be tested separately

### 🔧 **Best Practices**

1. **Use REST API for**:

   - Initial data loading
   - Message history
   - Room management
   - User management
   - Data persistence

2. **Use WebSocket for**:

   - Real-time message delivery
   - Typing indicators
   - User presence
   - Live notifications

3. **Error Handling**:

   - REST API errors return HTTP status codes
   - WebSocket errors are sent as JSON messages

4. **Authentication**:
   - REST API uses token authentication
   - WebSocket uses session authentication

## Setup Requirements

### **Backend Dependencies**

```bash
pip install django djangorestframework channels channels-redis
```

### **Redis Server**

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
redis-server
```

### **Django Settings**

```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'channels',
    'chat',
]

ASGI_APPLICATION = 'my_crew_manager.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

### **Run Server**

```bash
# Development
python manage.py runserver

# Production
daphne -b 0.0.0.0 -p 8000 my_crew_manager.asgi:application
```

This hybrid approach provides the best of both worlds: reliable data operations through REST APIs and real-time updates through WebSocket connections.
