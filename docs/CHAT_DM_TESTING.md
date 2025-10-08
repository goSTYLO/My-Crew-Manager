## Postman Guide: Test Direct Messages (DM)

Base URL: `http://localhost:8000`

Headers for all requests:
- `Authorization: Token <your_token>`
- For writes: `Content-Type: application/json`

---

### 1) Obtain a token (if you don't have one)
Use your existing auth/login endpoint from the users app to get a DRF token. Keep the token value handy.

---

### 2) Create or fetch a 1:1 DM room
- Method: POST
- URL: `http://localhost:8000/api/chat/rooms/direct/`
- Headers: `Authorization: Token <your_token>`, `Content-Type: application/json`
- Body (JSON):
```json
{ "user_id": 2 }
```
- Response: `Room` object. Copy `room_id` for next steps.

---

### 3) Send a message in the DM
- Method: POST
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/messages/`
- Headers: `Authorization: Token <your_token>`, `Content-Type: application/json`
- Body (JSON):
```json
{ "content": "Hey there!" }
```
- Response: `Message` object.

---

### 4) List messages in the DM
- Method: GET
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/messages/`
- Headers: `Authorization: Token <your_token>`
- Response: `Message[]` (ascending by `created_at`).

---

### 5) Soft-delete a message
- Method: DELETE
- URL: `http://localhost:8000/api/chat/rooms/<room_id>/messages/<message_id>/`
- Headers: `Authorization: Token <your_token>`
- Response: `204 No Content`
- Allowed if you're the sender or a room admin.

---

### 6) (Optional) Verify room in your list
- Method: GET
- URL: `http://localhost:8000/api/chat/rooms/`
- Headers: `Authorization: Token <your_token>`
- Response: list of rooms you belong to.

---

### Troubleshooting
- 401 Unauthorized: ensure header is exactly `Authorization: Token <value>`.
- 403 Forbidden: user isn't a member or lacks admin rights for admin-only actions.
- 400 Bad Request: missing required field (`user_id`, `content`).


