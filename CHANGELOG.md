# Changelog

## [Unreleased] - MERN Backend Migration

### Changed

- **AI** - `TrainModel2_Backlog.ipynb` Step 6: replaced `TRAINING_EXACT_PROMPT_ONLY` / `SHORT_BACKLOG_CUE` with **`PROMPT_MODE`** (`minimal_strict` default, `training_exact`, `legacy`); added compact `_minimal_strict_guide()` after Part 1 for fewer markdown/timeline hallucinations.
- **AI** - Model 2 microservice / `notebook_step_inference.generate_backlog_from_part1`: default **`BACKLOG_PROMPT_MODE=minimal_strict`** (shared [`backlog_minimal_strict_prompt.py`](AI/backlog_minimal_strict_prompt.py)) to match Step 6; `legacy` retains old guided `Input/Backlog` path.
- **AI** - Backlog generation token budgets match Step 6 for non-legacy (**420** / retry **500**); `_sanitize_backlog_response` strips prompt-echo lines and stops at “The following are some examples…”-style meta.
- **AI** - `notebook_step_inference`: post-decode **`_repair_backlog_flat_shape`** — cap tasks per story at 2, insert **`Epic N:`** from parsed goals when the model stacks extra `-Sub-Epic` lines, **truncate tail** when a 2nd+ Sub-Epic appears under the final goal (removes stray “phase” blocks); stricter VRAM unload between overview and backlog loads; backlog **`repetition_penalty`** 1.18.
- **AI** - Backlog **`max_new_tokens`** scales with goal/epic count beyond five (**`BACKLOG_TOKENS_PER_EPIC_OVER_5`**, default 95; **`BACKLOG_MAX_NEW_TOKENS_CAP`**, default 1024) so long overviews (e.g. 7+ goals) are not truncated at 420/500 tokens; minimal_strict echo filter only drops lines matching **`^Total epics:`** (avoids broad “goals” substring false positives).
- **AI** - **`generated_parsers.parse_training_part1_to_overview`** parses Model 2 flat JSONL **`prompt`** fields; **`test_microservice.py`** supports **`--list-jsonl`**, **`--jsonl-indices`**, **`--jsonl-start`** / **`--jsonl-count`**, **`--show-gold`** for backlog-only batch runs from the dataset.
- **AI** - **`test_microservice.py`** default run uses editable **`TEST_PROPOSALS`**: **phase 1** all overviews (Model 1 once), **phase 2** all backlogs (Model 2 once); outputs **`test_output_*_{1..N}`**; backlog sanitizer drops stray **`-Task N`** lines without a description (decoder fragments).
- **AI** - **`_extract_goal_epic_titles`**: no longer stops at the first blank line inside **Goals** (fixes single-epic token budget when bullets are separated by empty lines); backlog meta strip cuts at **Note:** / completion boilerplate; adaptive **`max_new_tokens`** / **`repetition_penalty`** tuned for 6+ goals.
- **AI** - **`BACKLOG_MAX_GOALS_FED`** (default **5**): truncate Part 1 **Goals** to the first N items before Model 2 (aligns with training; set **0** for no cap).
- **AI** - Backlog recovery: **retry pass** uses lower **`_backlog_retry_repetition_penalty`**; optional **second retry** (`BACKLOG_ENABLE_SECOND_RETRY`, default off); **`_repair_backlog_flat_shape`** now **dedupes** a second `Epic 1:` run, **snaps** `Epic N:` titles to **Goals**, normalizes **Sub-Epic/User Story** indices to 1, strips guide-echo parentheticals.

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
