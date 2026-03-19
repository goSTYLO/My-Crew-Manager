# WebSocket Migration Task Board

Project: MyCrewManager chat migration from Django WebSocket stack to Node and Express with Prisma
Scope lock: Preserve frontend behavior, event names, and payload shapes

## Board Columns
- Backlog
- In Progress
- Review
- Done
- Blocked

## Ticket WS-001: Capture Legacy WebSocket Contract
Status: Backlog
Owner: Backend Lead
Estimate: 1 day
Dependencies: None

Files to inspect:
- backend/apps/chat
- web/src/hooks/useRoomWebSocket.ts
- web/src/hooks/useNotificationWebSocket.ts
- web/src/contexts/WebSocketContext.tsx

Deliverables:
- Contract document with all paths, event names, payload schemas, auth behavior, reconnect behavior

Acceptance criteria:
- All current frontend WebSocket event names are listed
- All inbound and outbound payload fields are documented with type and required flag
- Room naming rules are documented
- Auth token transport modes are documented

Test cases:
- Manual capture from browser network tab for room socket, notification socket, and project update socket
- Verify contract doc matches at least 3 real payload captures per event type

## Ticket WS-002: Realtime Folder and Module Scaffolding
Status: Backlog
Owner: Backend Engineer
Estimate: 1 day
Dependencies: WS-001

Files to create:
- backend-node/src/realtime/index.js
- backend-node/src/realtime/ws-router.js
- backend-node/src/realtime/contracts/events.js
- backend-node/src/realtime/contracts/payload-schemas.js
- backend-node/src/realtime/compatibility/outbound-transformers.js
- backend-node/src/realtime/handlers/connect.handler.js
- backend-node/src/realtime/handlers/disconnect.handler.js
- backend-node/src/realtime/handlers/join-room.handler.js
- backend-node/src/realtime/handlers/leave-room.handler.js
- backend-node/src/realtime/handlers/chat-message.handler.js
- backend-node/src/realtime/handlers/ack.handler.js
- backend-node/src/realtime/rooms/room-registry.js
- backend-node/src/realtime/middleware/auth.socket.middleware.js
- backend-node/src/realtime/middleware/validation.socket.middleware.js

Deliverables:
- Bootstrapped realtime architecture with clear handler boundaries

Acceptance criteria:
- Server starts with no import errors
- Realtime index exports setup function consumed by server
- Handlers are separated by event responsibility

Test cases:
- Unit test import and initialization flow
- Smoke test startup with npm run dev

## Ticket WS-003: WebSocket Server Setup and Path Routing
Status: Backlog
Owner: Backend Engineer
Estimate: 1 day
Dependencies: WS-002

Files to update:
- backend-node/src/server.js
- backend-node/src/realtime/index.js
- backend-node/src/realtime/ws-router.js
- backend-node/src/sockets/ws-server.js

Deliverables:
- Centralized upgrade handling and path router for all socket endpoints

Acceptance criteria:
- Existing paths remain available:
  - /ws/chat/:roomId/
  - /ws/chat/notifications/
  - /ws/project-updates/
- Unknown path returns close with policy error
- No frontend URL change required

Test cases:
- Integration test for each known path connection success
- Integration test for unknown path rejection

## Ticket WS-004: Socket Authentication Middleware
Status: Backlog
Owner: Security Engineer
Estimate: 1 day
Dependencies: WS-003

Files to update:
- backend-node/src/realtime/middleware/auth.socket.middleware.js
- backend-node/src/middleware/auth.middleware.js
- backend-node/src/controllers/user.controller.js

Deliverables:
- Authentication for legacy Token and JWT Bearer at handshake
- Normalized auth errors in socket protocol

Acceptance criteria:
- Accepts Token in query for compatibility mode
- Accepts Authorization header with Token and Bearer
- Rejects invalid and expired tokens with auth_expired payload and close
- Socket context stores trusted user identity

Test cases:
- Valid Token should connect
- Valid Bearer should connect
- Missing token should fail with auth_expired
- Invalid token should fail with auth_expired

## Ticket WS-005: Event Contract Implementation
Status: Backlog
Owner: Backend Engineer
Estimate: 1 day
Dependencies: WS-004

Files to update:
- backend-node/src/realtime/contracts/events.js
- backend-node/src/realtime/contracts/payload-schemas.js
- backend-node/src/realtime/handlers/connect.handler.js
- backend-node/src/realtime/handlers/disconnect.handler.js
- backend-node/src/realtime/handlers/join-room.handler.js
- backend-node/src/realtime/handlers/leave-room.handler.js
- backend-node/src/realtime/handlers/chat-message.handler.js
- backend-node/src/realtime/handlers/ack.handler.js

Deliverables:
- Complete support for connect, disconnect, join_room, leave_room, chat_message, message_ack, auth_expired

Acceptance criteria:
- Every event validates payload before processing
- Every event returns legacy-compatible payload shape
- Error payload includes error, detail, message

Test cases:
- Contract tests per event with happy path and failure path

## Ticket WS-006: Room Membership and Authorization Checks
Status: Backlog
Owner: Backend Engineer
Estimate: 1 day
Dependencies: WS-005

Files to update:
- backend-node/src/realtime/rooms/room-membership.service.js
- backend-node/src/realtime/handlers/join-room.handler.js
- backend-node/src/realtime/handlers/chat-message.handler.js
- backend-node/src/controllers/chat.controller.js

Deliverables:
- Single source of truth for room access checks

Acceptance criteria:
- User cannot join room without membership
- User cannot send message without membership
- Membership logic shared by HTTP and WebSocket where possible

Test cases:
- Non-member join should fail
- Non-member message send should fail
- Member join and message send should pass

## Ticket WS-007: Prisma Schema for Chat and Read State
Status: Backlog
Owner: Data Engineer
Estimate: 1 day
Dependencies: WS-001

Files to update:
- backend-node/prisma/schema.prisma
- backend-node/prisma/migrations

Deliverables:
- Prisma models aligned with current PostgreSQL chat tables and optional read-state table

Acceptance criteria:
- Models map to existing table names and columns
- Foreign key behavior matches existing database constraints
- MessageReadState supports unread and replay requirements

Test cases:
- Prisma client generation passes
- Read and write integration tests pass for room, membership, message, read state

## Ticket WS-008: Message Persistence Pipeline
Status: Backlog
Owner: Backend Engineer
Estimate: 1.5 days
Dependencies: WS-006, WS-007

Files to update:
- backend-node/src/realtime/persistence/message.repository.js
- backend-node/src/realtime/handlers/chat-message.handler.js
- backend-node/src/realtime/compatibility/outbound-transformers.js
- backend-node/src/controllers/chat.controller.js

Deliverables:
- Persist then broadcast pipeline with canonical message payload

Acceptance criteria:
- Message is persisted before room broadcast
- Broadcast payload uses legacy fields: message_id, room_id, sender_id, sender_username, content, message_type, reply_to_id, created_at, edited_at, is_deleted
- Sender receives message_ack

Test cases:
- Send message then assert db row exists and broadcast occurred
- Verify payload shape exactly matches contract

## Ticket WS-009: Idempotency with client_message_id
Status: Backlog
Owner: Backend Engineer
Estimate: 1 day
Dependencies: WS-008

Files to update:
- backend-node/src/realtime/persistence/idempotency.repository.js
- backend-node/src/realtime/handlers/chat-message.handler.js
- backend-node/prisma/schema.prisma

Deliverables:
- Duplicate protection for retried message sends

Acceptance criteria:
- Duplicate client_message_id from same sender returns message_ack status duplicate
- No duplicate rows created for same sender and client_message_id

Test cases:
- Send same payload twice with same client_message_id and assert one DB row and two acks

## Ticket WS-010: Compatibility Transformers
Status: Backlog
Owner: Backend Engineer
Estimate: 1 day
Dependencies: WS-008

Files to update:
- backend-node/src/realtime/compatibility/outbound-transformers.js
- backend-node/src/realtime/compatibility/inbound-transformers.js
- backend-node/src/realtime/contracts/payload-schemas.js

Deliverables:
- Internal model to legacy payload transformer and inbound normalizer

Acceptance criteria:
- Frontend receives unchanged event names and payload fields
- Internal refactors do not alter frontend contract

Test cases:
- Snapshot tests for every outbound event payload
- Regression test with existing frontend hooks

## Ticket WS-011: Replay and Missed Message Recovery
Status: Backlog
Owner: Backend Engineer
Estimate: 1.5 days
Dependencies: WS-009

Files to update:
- backend-node/src/realtime/replay/replay.service.js
- backend-node/src/realtime/handlers/connect.handler.js
- backend-node/src/realtime/handlers/join-room.handler.js
- backend-node/src/realtime/persistence/read-state.repository.js

Deliverables:
- Replay service that returns missed messages by last seen message id or read-state cursor

Acceptance criteria:
- Reconnected user can request missed messages reliably
- Replay preserves ordering by message_id or created_at fallback

Test cases:
- Disconnect, send new messages, reconnect, replay and validate complete ordered sequence

## Ticket WS-012: Redis PubSub and Multi-Instance Broadcast
Status: Backlog
Owner: Platform Engineer
Estimate: 2 days
Dependencies: WS-008

Files to update:
- backend-node/src/config/redis.js
- backend-node/src/realtime/pubsub/redis-pubsub.js
- backend-node/src/realtime/pubsub/broadcast.service.js
- backend-node/src/realtime/rooms/room-registry.js

Deliverables:
- Cross-instance event synchronization using Redis publish and subscribe

Acceptance criteria:
- Message sent on instance A reaches socket connected to instance B
- No duplicate fanout loops from redis rebroadcast

Test cases:
- Two-instance integration test with one Redis broker
- Fanout validation under load

## Ticket WS-013: Rate Limiting and Abuse Controls
Status: Backlog
Owner: Security Engineer
Estimate: 1 day
Dependencies: WS-005

Files to update:
- backend-node/src/realtime/middleware/rate-limit.socket.middleware.js
- backend-node/src/http/middleware/rate-limit.http.middleware.js
- backend-node/src/realtime/handlers/chat-message.handler.js

Deliverables:
- Per-user and per-socket limits for message sends and join operations

Acceptance criteria:
- Exceeding threshold returns normalized error payload
- Limits configurable by environment variables

Test cases:
- Burst test exceeding threshold
- Normal traffic remains unaffected

## Ticket WS-014: Logging and Monitoring
Status: Backlog
Owner: Platform Engineer
Estimate: 1 day
Dependencies: WS-005

Files to update:
- backend-node/src/config/logger.js
- backend-node/src/config/monitoring.js
- backend-node/src/realtime/index.js
- backend-node/src/realtime/handlers/chat-message.handler.js

Deliverables:
- Structured logs and metrics for websocket lifecycle and chat throughput

Acceptance criteria:
- Logs include connection_id, user_id, room_id, event_type, latency
- Metrics emitted for connect count, auth failures, message latency, replay latency

Test cases:
- Verify logs for connect and message events
- Verify metrics exported and scraped

## Ticket WS-015: Error Handling Unification for Realtime
Status: Backlog
Owner: Backend Engineer
Estimate: 1 day
Dependencies: WS-005

Files to update:
- backend-node/src/realtime/ws-connection-context.js
- backend-node/src/realtime/handlers
- backend-node/src/middleware/error.middleware.js

Deliverables:
- Realtime and HTTP both return normalized error payload shape

Acceptance criteria:
- All failure events include error, detail, message
- No raw stack traces sent to clients

Test cases:
- Trigger validation, auth, and persistence errors and verify payload shape

## Ticket WS-016: Parallel Run and Mirror Pipeline
Status: Backlog
Owner: Migration Lead
Estimate: 2 days
Dependencies: WS-010, WS-012

Files to update:
- backend-node/src/realtime/index.js
- backend-node/src/realtime/pubsub/broadcast.service.js
- deployment and ingress configs

Deliverables:
- Runtime flag to run Node WebSocket in parallel with Django and mirror events

Acceptance criteria:
- Mirror mode emits parity logs without affecting user-visible behavior
- Mismatch reports produced for payload and ordering

Test cases:
- Shadow run against staging traffic with mismatch threshold report

## Ticket WS-017: Gradual Cutover Controls
Status: Backlog
Owner: Migration Lead
Estimate: 1.5 days
Dependencies: WS-016

Files to update:
- deployment configs
- backend-node/src/config/env.js
- backend-node/src/realtime/index.js

Deliverables:
- Feature flags and routing controls for phased traffic shift

Acceptance criteria:
- Route chat notifications, then room sockets, then message send path
- Rollback switch restores Django websocket handling quickly

Test cases:
- Controlled traffic percentage rollout test
- Rollback drill test

## Ticket WS-018: Decommission Django Realtime
Status: Backlog
Owner: Migration Lead
Estimate: 1 day
Dependencies: WS-017

Files to update:
- Django channels routing and consumers
- Infra configs
- Runbooks and docs

Deliverables:
- Django websocket stack removed after stabilization window

Acceptance criteria:
- Node realtime handles all production websocket traffic
- No contract regressions in frontend behavior for two release cycles

Test cases:
- End-to-end production checklist validation
- Post-cutover error budget validation

## Definition of Done for each ticket
- Code merged with reviewer approval
- Focused tests added and passing
- No change to frontend behavior unless explicitly approved
- Monitoring and logging for new path in place
- Runbook section updated

## Suggested Sprint Allocation
Sprint 1:
- WS-001, WS-002, WS-003, WS-004, WS-005

Sprint 2:
- WS-006, WS-007, WS-008, WS-009, WS-010

Sprint 3:
- WS-011, WS-012, WS-013, WS-014, WS-015

Sprint 4:
- WS-016, WS-017, WS-018

## Focused Test Matrix Summary
- Contract parity tests for every websocket event
- Auth path tests for Token and Bearer
- Membership and authorization tests
- Idempotency duplicate prevention tests
- Replay correctness and ordering tests
- Multi-instance Redis fanout tests
- Rate-limit behavior tests
- Cutover and rollback drills
