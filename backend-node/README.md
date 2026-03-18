# My Crew Manager - Node.js Backend (MERN Migration)

Node.js/Express backend replacing the Django backend. Uses MongoDB and the `ws` package for WebSockets.

## Setup

1. Install dependencies: `npm install`
2. **Env:** backend-node loads from the **project root `.env`** (shared with web, Django, mobile). Add these if missing:
   - `SECRET_KEY` - Application secret
   - `JWT_SECRET` - JWT signing secret (can match SECRET_KEY)
   - `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/my_crew_manager`)
   - `AI_SERVICE_URL` - URL of the FastAPI AI microservice (default: `http://localhost:8002`)
   - `DISABLE_2FA` - Set to `true` to fully disable 2FA (login skips 2FA, 2FA endpoints return 503). Default: `false`
   - `RATE_LIMIT_MAX` - Requests per 15 min. Dev default 500; production 100. Increase (e.g. `1000`) if polling causes 429.

3. Run: `npm run dev` (or `npm start`)

## Python AI Microservice

The LLM pipeline (ingest-proposal, generate-backlog) runs in Python. The Node backend proxies these requests to the Python service.

The FastAPI AI service at `AI/` exposes `POST /generate-overview` and `POST /generate-backlog`. Set `AI_SERVICE_URL=http://localhost:8002` and run `cd AI && uvicorn main:app --port 8002 --reload`.

## Testing

Run `npm test` for Jest unit and integration tests. Uses `mongodb-memory-server` for integration tests. Set `DISABLE_2FA=true` in test env to simplify auth flows.

## API

- `/api/user/` - Auth, 2FA, profile
- `/api/chat/` - Rooms, messages
- `/api/ai/` - Projects, epics, tasks, invitations, notifications
  - `POST /api/ai/proposals/` - Upload PDF proposal (multipart form: `file`, `project_id`)
  - `GET /api/ai/projects/my-projects/` - List projects (alias for `/projects/`)
  - `POST /api/ai/notifications/:id/mark_read/` - Mark notification read
  - `POST /api/ai/notifications/mark_all_read/` - Mark all notifications read

## WebSocket

- `ws://host/ws/project-updates/?token=<token>` - Project updates
- `ws://host/ws/chat/notifications/?token=<token>` - Chat notifications
- `ws://host/ws/chat/<room_id>/?token=<token>` - Room chat

## Data Migration

Run `npm run migrate` after configuring PostgreSQL connection in the migration script to transfer data from the Django/PostgreSQL backend to MongoDB.
