# My Crew Manager - Node.js Backend

Node.js/Express backend for My Crew Manager. Uses **PostgreSQL** with **Prisma** ORM and the `ws` package for WebSockets.

## Latest Commit Summary (Logger + Security + Middleware + Config)

This backend commit introduced a full hardening pass focused on request tracing, centralized errors, structured logging, and input protection while keeping API compatibility with the existing frontend.

### 1) Structured logging and request tracing

- Added request correlation via `x-request-id` middleware.
- Upgraded Winston logger to structured metadata logging with environment-aware output:
   - development: colorized console logs with metadata
   - production: JSON logs
- Added file log transports:
   - `logs/error.log` (error only)
   - `logs/combined.log` (all levels)
- Added structured auth logs for signup/login/refresh and auth failures.

### 2) Centralized error handling (non-breaking API envelope)

- Added reusable app error classes (`AppError`, `ValidationAppError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`).
- Refactored auth middleware and auth controller paths to use `next(error)` for centralized handling.
- Error middleware now preserves frontend-compatible response fields:
   - `error`
   - `detail`
   - `message`
   - optional `details`
   - optional `request_id`

### 3) Security hardening middleware

- Added global input sanitization middleware for `body`, `query`, and `params`.
- Sanitization strips HTML/script payloads from string inputs.
- Added suspicious payload detection and warning logs for common XSS/SQL injection patterns.
- Sensitive fields in logs are redacted (for example password/token fields).

### 4) Route validation middleware (Zod)

- Added generic validation middleware for `body`, `params`, and `query`.
- Added shared Zod schemas for auth/chat/AI critical endpoints.
- Applied validation to critical routes first (auth, chat core routes, AI project core routes) to reduce risk without breaking existing clients.

### 5) Middleware stack and runtime configuration updates

- App pipeline now includes:
   - CORS allowlist and localhost support in development
   - Helmet security headers
   - Rate limiting
   - request-id middleware
   - JSON/urlencoded parsers + cookies
   - input sanitization
   - route handlers
   - centralized error middleware as the final handler

### 6) Compatibility-focused API improvements included in this cycle

- Added/kept chat compatibility aliases and routes used by the frontend:
   - `PATCH /api/chat/rooms/:id`
   - `PUT /api/chat/rooms/:id`
   - `POST /api/chat/rooms/:id/leave/`
   - `POST /api/chat/rooms/:id/mark_read/`
   - `POST /api/chat/rooms/:id/nickname/`
- Added validation on chat room/message params and message list query.

## Setup

1. Install dependencies: `npm install`
2. **Database:** Use PostgreSQL. Configure connection via env:
    - `POSTGRES_URI` - Full connection string: `postgresql://user:pass@host:5432/mycrewmanager_db`
3. **Env** (from project root `.env`):
    - `JWT_SECRET` - JWT signing secret (must be at least 32 chars)
    - `PORT` - API port (default: `5000`)
    - `NODE_ENV` - `development`, `test`, or `production`
    - `FRONTEND_URL` - Allowed CORS origin(s), comma-separated
    - `LOG_LEVEL` - Logger level (default config supports environment-aware logging)
    - `RATE_LIMIT_WINDOW_MS` - Rate limit window size
    - `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
    - `DISABLE_2FA` - Set to `true` to fully disable 2FA (default: `false`)
    - `AI_SERVICE_URL` - URL of the FastAPI AI microservice (default: `http://localhost:8002`)

4. Generate Prisma client: `npm run db:generate` (or `npx prisma generate`)
5. For existing DB: schema is maintained via `prisma/schema.prisma`. Use `npx prisma db pull` to introspect and regenerate if the DB structure changes.
6. Seed: `npm run seed` or `npm run seed:reset` to populate with PM/Dev accounts and sample data
7. Run: `npm run dev` (or `npm start`)

## Python AI Microservice

The LLM pipeline (ingest-proposal, generate-backlog) runs in Python. The Node backend proxies these requests to the Python service.

The FastAPI AI service at `AI/` exposes `POST /generate-overview` and `POST /generate-backlog`. Set `AI_SERVICE_URL=http://localhost:8002` and run `cd AI && uvicorn main:app --port 8002 --reload`.

## Testing

Run `npm test` for Jest unit and integration tests. Uses PostgreSQL with test-aware environment settings. Ensure a test database exists and points to a safe test `POSTGRES_URI`. Set `DISABLE_2FA=true` in test env to simplify auth flows.

## Middleware and Security Notes

- Request IDs:
   - Incoming `x-request-id` is preserved.
   - If missing, server generates a UUID.
   - Response always includes `x-request-id`.
- Error handling:
   - All operational errors should flow through `next(error)` to keep consistent response envelopes and logging.
- Validation:
   - Route-level Zod validation is used on critical endpoints and can be extended incrementally.
- Sanitization:
   - Input sanitization runs before route handlers and removes HTML from user-provided strings.
- Logging:
   - Security events and auth failures are logged with contextual metadata.

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

## Database

- Prisma schema: `prisma/schema.prisma`
- Generate client: `npm run db:generate`
- Open Prisma Studio: `npm run db:studio`

### Troubleshooting DB connection

If you see `Authentication failed against the database server`:

1. **Verify PostgreSQL is running** – `psql -U postgres -h localhost -c "SELECT 1"`
2. **Check connection string** – Ensure `POSTGRES_URI` points to the correct host, port, database, username, and password.
3. **Test connection** – `psql -U postgres -h localhost -d mycrewmanager_db` (enter password when prompted)
4. **Restore from dump** – If the DB is empty, restore: `pg_restore -d mycrewmanager_db -U postgres MycrewManager_db_2.sql`
5. **Extract sample data** – Without a live DB, use `pg_restore --data-only -f restore_projects.sql -t ai_api_project ... MycrewManager_db_2.sql`, then `node scripts/parse-dump-to-md.js` to regenerate `sample-outputs.md`
