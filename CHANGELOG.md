# Changelog

## [Unreleased] - MERN Backend Migration

### Added

- **AI LLM Optimization (Phase 1–3)**:
  - `MODEL_ID` and `PEFT_ADAPTER_PATH` env vars for configurable model and LoRA adapter
  - Default model: `Qwen/Qwen2-0.5B-Instruct` (6GB VRAM-friendly)
  - LoRA adapter loading in `llm_cache.py` when `PEFT_ADAPTER_PATH` is set
  - Dataset structure: `AI/llms/fine_tune/dataset/*.jsonl` (summary, features, roles, goals, timeline, backlog)
  - `prepare_dataset.py` rewritten for prompt–response JSONL (replaces recovery-plan dataset)
  - `train_project_llm.ipynb` Jupyter notebook for LoRA training
  - `build_synthetic.py` optional script for synthetic example generation
  - `python-dotenv` in AI service for `.env` loading

- **AI/** - FastAPI stateless AI microservice (replaces Django for LLM):
  - `GET /health` - Health check
  - `POST /generate-overview` - Generate project overview from proposal text
  - `POST /generate-backlog` - Generate backlog epics from proposal text
- **backend-node** - Full API gap closure:
  - `GET /api/ai/projects/:id/backlog/` - Serve backlog from MongoDB
  - `GET /api/ai/projects/:id/statistics/` - Task/sprint counts
  - CRUD for project-features, project-roles, project-goals, timeline-weeks, timeline-items
  - `DELETE /api/ai/project-members/:id/` - Remove member
  - `PATCH /api/ai/story-tasks/:id/` - Patch task (mobile compatibility)
  - `GET /api/ai/story-tasks/user-assigned/`, `recent-completed/`, `POST bulk-assign/`
  - `DELETE /api/ai/notifications/:id/`, `GET unread_count/`
  - `GET /api/ai/invitations/my-invitations/`, `POST :id/decline`
  - `PUT /api/user/me/` - Profile update (mobile uses PUT)
- **backend-node** - API route parity with Django/web app:
  - `POST /api/ai/proposals/` - Upload PDF proposal, parse text with pdf-parse, store in MongoDB
  - `GET /api/ai/projects/my-projects/` - Alias for list projects (web compatibility)
  - `POST /api/ai/notifications/:id/mark_read/` - Mark single notification read (web compatibility)
  - `POST /api/ai/notifications/mark_all_read/` - Mark all user notifications as read

### Fixed

- **web** - Chat API path bug: `fetch('/rooms/:id/')` now uses `/chat/rooms/:id/` in chat.tsx and chat2.0.tsx

### Added (earlier)

- **backend-node/** - New Node.js/Express backend (MERN migration)
  - MongoDB + Mongoose for data persistence
  - `ws` package for WebSockets (no Redis, in-memory room broadcast)
  - Full auth: Token + JWT, HTTP-only refresh cookie, TOTP 2FA (speakeasy)
  - REST API: `/api/user/`, `/api/chat/`, `/api/ai/` (parity with Django)
  - WebSocket paths: `/ws/project-updates/`, `/ws/chat/notifications/`, `/ws/chat/<room_id>/`
  - FastAPI AI microservice at `AI_SERVICE_URL` (default port 8002)
  - Data migration script: `backend-node/scripts/migrate.js` (PostgreSQL → MongoDB)

### Changed

- **web/src/config/api.ts** - Default API base URL port 8000 → 8001 (Node backend)
- **mobile/.../constants.dart** - Default baseUrl port 8000 → 8001

### Architecture

- **Django deprecated** for AI/LLM — FastAPI at `AI/` (port 8002) is the stateless AI service
- backend-node calls FastAPI via `AI_SERVICE_URL` for overview/backlog generation
- Clients unchanged (same API paths, same WebSocket protocol); mobile already targets port 8001
