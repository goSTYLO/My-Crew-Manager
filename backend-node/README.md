# My Crew Manager - Node.js Backend

Node.js/Express backend for My Crew Manager. Uses **PostgreSQL** with **Prisma** ORM and the `ws` package for WebSockets.

## Setup

1. Install dependencies: `npm install`
2. **Database:** Use PostgreSQL. Configure connection via env:
   - `DATABASE_URL` - Full connection string: `postgresql://user:pass@host:5432/mycrewmanager_db`
   - Or use `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` (backend-node builds `DATABASE_URL` from these)
3. **Env** (from project root `.env`):
   - `SECRET_KEY` - Application secret
   - `JWT_SECRET` - JWT signing secret (can match SECRET_KEY)
   - `AI_SERVICE_URL` - URL of the FastAPI AI microservice (default: `http://localhost:8002`)
   - `DISABLE_2FA` - Set to `true` to fully disable 2FA (default: `false`)
   - `RATE_LIMIT_MAX` - Requests per 15 min. Dev default 500; production 100.

4. Generate Prisma client: `npm run db:generate` (or `npx prisma generate`)
5. For existing DB: schema is maintained via `prisma/schema.prisma`. Use `npx prisma db pull` to introspect and regenerate if the DB structure changes.
6. Seed: `npm run seed` or `npm run seed:reset` to populate with PM/Dev accounts and sample data
7. Run: `npm run dev` (or `npm start`)

## Python AI Microservice

The LLM pipeline (ingest-proposal, generate-backlog) runs in Python. The Node backend proxies these requests to the Python service.

The FastAPI AI service at `AI/` exposes `POST /generate-overview` and `POST /generate-backlog`. Set `AI_SERVICE_URL=http://localhost:8002` and run `cd AI && uvicorn main:app --port 8002 --reload`.

## Testing

Run `npm test` for Jest unit and integration tests. Uses PostgreSQL (same DB or `DB_NAME_test` when `NODE_ENV=test`). Ensure a test database exists. Set `DISABLE_2FA=true` in test env to simplify auth flows.

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
2. **Check credentials** – Root `.env` uses `DB_USER=postgres`, `DB_PASSWORD=1401`. Ensure your PostgreSQL `postgres` user has this password (or update `.env`).
3. **Test connection** – `psql -U postgres -h localhost -d mycrewmanager_db` (enter password when prompted)
4. **Restore from dump** – If the DB is empty, restore: `pg_restore -d mycrewmanager_db -U postgres MycrewManager_db_2.sql`
5. **Extract sample data** – Without a live DB, use `pg_restore --data-only -f restore_projects.sql -t ai_api_project ... MycrewManager_db_2.sql`, then `node scripts/parse-dump-to-md.js` to regenerate `sample-outputs.md`
