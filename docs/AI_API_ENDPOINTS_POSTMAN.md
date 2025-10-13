## AI API (Projects & Backlog) — CRUD Endpoints

Base path: `{{base_url}}/api/ai/` (confirm the project's URL conf mounts `ai_api.urls` at `/api/ai/`)

Note: All endpoints require authentication (Token header).

1. Projects

- List projects

```http
GET {{base_url}}/api/ai/projects/
```

- Create project

```http
POST {{base_url}}/api/ai/projects/
Content-Type: application/json

{
  "title": "My New Project",
  "summary": "Short summary"
}
```

- Retrieve project

```http
GET {{base_url}}/api/ai/projects/{id}/
```

- Update project

```http
PUT {{base_url}}/api/ai/projects/{id}/
Content-Type: application/json

{
  "title": "Updated title",
  "summary": "Updated summary"
}
```

- Partial update

```http
PATCH {{base_url}}/api/ai/projects/{id}/
Content-Type: application/json

{
  "summary": "Just update summary"
}
```

- Delete project

```http
DELETE {{base_url}}/api/ai/projects/{id}/
```

2. Proposals

- Upload proposal (PDF)

```http
POST {{base_url}}/api/ai/proposals/
Content-Type: multipart/form-data

form-data:
  file: <file.pdf>
  project_id: <project_id>
```

- List / Retrieve / Update / Delete follow standard DRF ModelViewSet routes:
  - `GET /api/ai/proposals/`
  - `GET /api/ai/proposals/{id}/`
  - `PUT /api/ai/proposals/{id}/`
  - `PATCH /api/ai/proposals/{id}/`
  - `DELETE /api/ai/proposals/{id}/`

3. Project Features, Roles, Goals

Each resource supports standard CRUD at these endpoints:

- `GET /api/ai/project-features/?project_id={project_id}`
- `POST /api/ai/project-features/` (body: `{ "project": project_id, "title": "..." }`)
- `GET /api/ai/project-features/{id}/`
- `PUT/PATCH /api/ai/project-features/{id}/`
- `DELETE /api/ai/project-features/{id}/`

Same pattern applies for `/project-roles/` and `/project-goals/` (fields differ: `role` or `title, role`).

4. Timeline

- `GET /api/ai/timeline-weeks/?project_id={project_id}`
- `POST /api/ai/timeline-weeks/` (body: `{ "project": id, "week_number": 1 }`)
- `GET /api/ai/timeline-items/?week_id={week_id}`
- `POST /api/ai/timeline-items/` (body: `{ "week": week_id, "title": "..." }`)

5. Backlog (Epics / SubEpics / UserStories / StoryTasks)

- Epics: `/api/ai/epics/` (filter `?project_id=`)
- SubEpics: `/api/ai/sub-epics/` (filter `?epic_id=`)
- UserStories: `/api/ai/user-stories/` (filter `?sub_epic_id=`)
- StoryTasks: `/api/ai/story-tasks/` (filter `?user_story_id=`)

Example: create an epic

```http
POST {{base_url}}/api/ai/epics/
Content-Type: application/json

{
  "project": 1,
  "title": "New Epic",
  "description": "Epic description"
}
```

6. Special project actions

- Ingest proposal to enrich project using LLM:

```http
PUT {{base_url}}/api/ai/projects/{project_id}/ingest-proposal/{proposal_id}/
Content-Type: application/json

{
  "title": "Optional override title"
}
```

- Generate backlog from latest proposal:

```http
PUT {{base_url}}/api/ai/projects/{project_id}/generate-backlog/
```

```http
GET {{base_url}}/api/ai/projects/{project_id}/backlog/
```

---
