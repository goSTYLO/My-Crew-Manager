## Chat API

Base URL: `/api/chat/`

Authentication: Token auth via DRF. Send header:

```
Authorization: Token <your_token>
```

Content-Type: JSON for request and response bodies unless stated.

---

### Models (shapes)

- Room
  - `room_id` (int)
  - `name` (string | null)
  - `is_private` (bool)
  - `created_by_id` (int)
  - `created_at` (ISO datetime)
  - `members_count` (int)

- Membership
  - `membership_id` (int)
  - `room_id` (int)
  - `user_id` (int)
  - `is_admin` (bool)
  - `joined_at` (ISO datetime)

- Message
  - `message_id` (int)
  - `room_id` (int)
  - `sender_id` (int)
  - `content` (string)
  - `created_at` (ISO datetime)
  - `edited_at` (ISO datetime | null)
  - `is_deleted` (bool)

---

### Rooms

List my rooms
- Method/URL: GET `/api/chat/rooms/`
- Query params: none
- Response: `Room[]`

Create room
- Method/URL: POST `/api/chat/rooms/`
- Body:
  ```json
  { "name": "Design", "is_private": true }
  ```
- Response: `Room` (creator auto-joined as admin)

Get room
- Method/URL: GET `/api/chat/rooms/{room_id}/`
- Response: `Room`

Update room
- Method/URL: PATCH `/api/chat/rooms/{room_id}/`
- Body (any subset):
  ```json
  { "name": "New Name", "is_private": false }
  ```
- Response: `Room`

Delete room (admin required)
- Method/URL: DELETE `/api/chat/rooms/{room_id}/`
- Response: 204 No Content

List members
- Method/URL: GET `/api/chat/rooms/{room_id}/members/`
- Response: `Membership[]`

Invite/add member (admin required)
- Method/URL: POST `/api/chat/rooms/{room_id}/invite/`
- Body:
  ```json
  { "user_id": 123 }
  ```
- Response:
  ```json
  { "detail": "User invited/added successfully" }
  ```

Remove member (admin required)
- Method/URL: POST `/api/chat/rooms/{room_id}/remove_member/`
- Body:
  ```json
  { "user_id": 123 }
  ```
- Response:
  ```json
  { "detail": "Member removed" }
  ```

---

### Messages (nested under room)

List messages in a room
- Method/URL: GET `/api/chat/rooms/{room_id}/messages/`
- Response: `Message[]` (ascending by `created_at`)

Send message
- Method/URL: POST `/api/chat/rooms/{room_id}/messages/`
- Body:
  ```json
  { "content": "Hello team" }
  ```
- Response: `Message`

Delete message (soft delete)
- Method/URL: DELETE `/api/chat/rooms/{room_id}/messages/{message_id}/`
- Response: 204 No Content
- Rules: allowed if sender or room admin

---

### Authorization & Rules
- All endpoints require authentication.
- You can only see rooms you belong to and messages in those rooms.
- Room creator is added as admin automatically.
- Only admins can invite/remove members and delete rooms.
- Message deletion is soft: `is_deleted` toggled to true, content remains server-side.

---

### Examples (curl)

List my rooms
```bash
curl -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/chat/rooms/
```

Create or get a 1:1 DM room
- Method/URL: POST `/api/chat/rooms/direct/`
- Body:
  ```json
  { "user_id": 123 }
  ```
- Response: `Room` (returns existing DM if found, otherwise creates)

Create a room
```bash
curl -X POST -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Design","is_private":true}' \
  http://localhost:8000/api/chat/rooms/
```

Invite a user
```bash
curl -X POST -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id":123}' \
  http://localhost:8000/api/chat/rooms/1/invite/
```

Send a message
```bash
curl -X POST -H "Authorization: Token $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":"Hello"}' \
  http://localhost:8000/api/chat/rooms/1/messages/
```

Delete a message
```bash
curl -X DELETE -H "Authorization: Token $TOKEN" \
  http://localhost:8000/api/chat/rooms/1/messages/10/
```

---

### Response codes
- 200 OK / 201 Created / 204 No Content on success
- 400 Bad Request for invalid payloads
- 401 Unauthorized when missing/invalid token
- 403 Forbidden when not a member or not admin
- 404 Not Found when resource doesn't exist or not accessible

---

### Notes for frontend
- Pagination not yet added; if needed, we can add DRF pagination for messages.
- Real-time updates are not part of this REST API; consider WebSocket integration (Django Channels) for live chat, typing indicators, and presence.


