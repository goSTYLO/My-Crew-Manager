## Users Endpoints

Base path: `{{base_url}}/api/users/`

All endpoints require authentication (Token header).

### List Users

```http
GET {{base_url}}/api/users/
Authorization: Token {{auth_token}}
```

Example response:

```json
[
  {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com"
  },
  {
    "id": 2,
    "username": "bob",
    "email": "bob@example.com"
  }
]
```

### Retrieve User

```http
GET {{base_url}}/api/users/{id}/
Authorization: Token {{auth_token}}
```

Example response:

```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com"
}
```

### Create User

```http
POST {{base_url}}/api/users/
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword"
}
```

Example response:

```json
{
  "id": 3,
  "username": "newuser",
  "email": "newuser@example.com"
}
```

### Update User

```http
PUT {{base_url}}/api/users/{id}/
Content-Type: application/json

{
  "email": "alice@newdomain.com"
}
```

### Delete User

```http
DELETE {{base_url}}/api/users/{id}/
```

---
