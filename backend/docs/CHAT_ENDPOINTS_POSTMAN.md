## Chat Endpoints

Base path: `{{base_url}}/api/chat/`

All endpoints require authentication (Token header).

### List Rooms

```http
GET {{base_url}}/api/chat/rooms/
Authorization: Token {{auth_token}}
```

Example response:

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

### Create Room

```http
POST {{base_url}}/api/chat/rooms/
Content-Type: application/json

{
  "name": "New Project Team",
  "is_private": true
}
```

### Get Room Details

```http
GET {{base_url}}/api/chat/rooms/{room_id}/
Authorization: Token {{auth_token}}
```

### Invite User to Room

```http
POST {{base_url}}/api/chat/rooms/{room_id}/invite/
Content-Type: application/json

{
  "email": "other.user@example.com"
}
```

### List Room Members

```http
GET {{base_url}}/api/chat/rooms/{room_id}/members/
Authorization: Token {{auth_token}}
```

### Send Message

```http
POST {{base_url}}/api/chat/rooms/{room_id}/messages/
Content-Type: application/json

{
  "content": "Hello everyone!",
  "message_type": "text"
}
```

### Get Room Messages

```http
GET {{base_url}}/api/chat/rooms/{room_id}/messages/
Authorization: Token {{auth_token}}
```

### Delete Message

```http
DELETE {{base_url}}/api/chat/rooms/{room_id}/messages/{message_id}/
```

### WebSocket Endpoints

- Room events: `ws://localhost:8000/ws/chat/{room_id}/`
- Notifications: `ws://localhost:8000/ws/chat/notifications/`

See the main Postman guide for real-time event payloads and usage.

### Direct 1:1 Room by Email

```http
POST {{base_url}}/api/chat/rooms/direct/
Content-Type: application/json

{
  "email": "other.user@example.com"
}
```
