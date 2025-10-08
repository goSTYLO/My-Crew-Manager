## Postman Guide: Test Group Chats

Base URL: `http://localhost:8000`

Headers for all requests:
- `Authorization: Token <your_token>`
- For writes: `Content-Type: application/json`

---

### 1) Create a group room
- Method: POST
- URL: `http://localhost:8000/api/chat/rooms/`
- Headers: `Authorization: Token <your_token>`, `Content-Type: application/json`
- Body (JSON):
```json
{ "name": "Design Team", "is_private": true }
```
- Response: `Room` object. Creator is auto-added as admin. Copy `room_id`.

---

### 2) Invite/add members (admin)
- Method: POST
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/invite/`
- Headers: `Authorization: Token <your_token>`, `Content-Type: application/json`
- Body (JSON):
```json
{ "user_id": 5 }
```
- Response:
```json
{ "detail": "User invited/added successfully" }
```
Repeat for each member.

---

### 3) List members
- Method: GET
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/members/`
- Headers: `Authorization: Token <your_token>`
- Response: `Membership[]`

---

### 4) Send a message in the group
- Method: POST
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/messages/`
- Headers: `Authorization: Token <your_token>`, `Content-Type: application/json`
- Body (JSON):
```json
{ "content": "Kickoff at 10am" }
```
- Response: `Message`

---

### 5) List messages in the group
- Method: GET
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/messages/`
- Headers: `Authorization: Token <your_token>`
- Response: `Message[]` (ascending by `created_at`)

---

### 6) Remove a member (admin)
- Method: POST
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/remove_member/`
- Headers: `Authorization: Token <your_token>`, `Content-Type: application/json`
- Body (JSON):
```json
{ "user_id": 5 }
```
- Response:
```json
{ "detail": "Member removed" }
```

---

### 7) Update room details (optional)
- Method: PATCH
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/`
- Headers: `Authorization: Token <your_token>`, `Content-Type: application/json`
- Body (JSON):
```json
{ "name": "Design + PM", "is_private": false }
```
- Response: updated `Room`

---

### 8) Delete the room (admin)
- Method: DELETE
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/`
- Headers: `Authorization: Token <your_token>`
- Response: `204 No Content`

---

### Troubleshooting
- 401 Unauthorized: header must be `Authorization: Token <value>`.
- 403 Forbidden: only members can access; only admins can invite/remove/delete.
- 400 Bad Request: missing `name`, `is_private`, or `user_id` depending on the action.
