# Tasks Due Date Testing

## Overview

- Adds date-only `due_date` to story tasks (plus `created_at`, `updated_at`).
- Managers set/clear due dates in `web/src/view_pages/manager/monitor_created.tsx` (Backlog tab, edit mode).
- New notification type: `task_due_date_set` (fires on set/change). Toasts appear for managers/developers.
- Realtime: `task_update` payload includes `due_date`; UIs refresh automatically.
- No scheduled reminders (explicitly out of scope).

## Backend Notes

- Model: `StoryTask` now has `due_date: DateField`, `created_at`, `updated_at`.
- Serializer: `StoryTaskSerializer` exposes `due_date` (rw), timestamps (ro).
- Permissions: Only project owner can set/change `due_date` via PATCH.
- Notifications: Emits `task_due_date_set` to assignee and owner (except the actor).
- Realtime: BroadcastService sends `task_update` after changes.

## Frontend Notes

- Manager backlog (edit mode): date picker to set/clear due date. Read-only badge otherwise.
- User tasks page: shows small due date badge; red if overdue, blue otherwise.
- Top bars: `task_due_date_set` included in important notification types (toasts).

## How to Test (Manual)

1) Migrate and run server
```bash
python backend/manage.py makemigrations
python backend/manage.py migrate
python backend/manage.py runserver
```

2) Open two sessions (manager and developer), navigate to the same project.

3) In Manager UI (Backlog tab):
- Click Edit → set a due date on any task → verify success toast.
- Due date badge appears on task rows.

4) In Developer UI (Tasks tab):
- Verify due date badge appears/updates in real time (no reload).
- If overdue (pick a past date), badge turns red.

5) Realtime & Notifications
- Open browser consoles; confirm `task_update` messages received.
- Confirm toast for `Task Due Date Updated` appears for the assignee/owner (not the actor).

## How to Test (API)

Set due date via PATCH (owner only):
```bash
curl -X PATCH \
  -H "Authorization: Token <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"due_date":"2025-12-31"}' \
  http://localhost:8000/api/ai/story-tasks/<TASK_ID>/
```

Clear due date:
```bash
curl -X PATCH \
  -H "Authorization: Token <OWNER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"due_date":null}' \
  http://localhost:8000/api/ai/story-tasks/<TASK_ID>/
```

## Automated Check (Interactive)

The comprehensive WS tester now includes the new due date test:
```bash
python tests/test_websocket_interactive.py
```
- During “TESTING ALL 9 NOTIFICATION TYPES” it also runs:
  - “10. Task Due Date Set” → finds a task and PATCHes `due_date` to today+7.
- Watch for `task_due_date_set` toast in the UI and WS logs in the terminal.

## Notes

- `due_date` format is `YYYY-MM-DD`.
- No reminder scheduling; this update only sets/stores the date and sends immediate notifications.

