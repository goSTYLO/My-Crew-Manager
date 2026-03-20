# AI layer ↔ backend-node integration

This doc maps [generated_parsers.py](generated_parsers.py) / CLI scripts to [backend-node/src/controllers/ai.controller.js](../backend-node/src/controllers/ai.controller.js) and [Prisma](../backend-node/prisma/schema.prisma).

## Overview JSON (`parse_overview_text`)

Used by [project_overview.py](project_overview.py) with `--json-out`.

| Field | Parser shape | `saveOverviewToDb` | Prisma |
|-------|----------------|-------------------|--------|
| `title` | `string \| null` | `ai_api_project.title` | ✓ |
| `summary` | `string \| null` | `ai_api_project.summary` | ✓ |
| `features` | `string[]` | `ai_api_projectfeature.title` (createMany) | ✓ |
| `roles` | `string[]` | `ai_api_projectrole.role` | ✓ |
| `goals` | `{ title, role? }[]` | `ai_api_projectgoal.title`, `.role` | ✓ |
| `timeline` | `{ week_number, goals: { title }[] }[]` | `ai_api_timelineweek` + `ai_api_timelineitem.title` | ✓ |

`saveOverviewToDb` also accepts timeline week `goals` entries as **plain strings** (see controller); the parser emits `{ title }` objects, which the controller maps with `g.title`.

**Edge case:** Overview text must use a line matching `Title:` (see `_extract_sections`). A lowercase-only `title:` line may not populate `title`.

## Backlog JSON (`parse_backlog_text`)

Used by [project_backlog.py](project_backlog.py) with `--json-out`.

| Field | Parser shape | `saveBacklogToDb` | Prisma |
|-------|----------------|-------------------|--------|
| `epics[]` | present | Epic create | `ai_api_epic` |
| `title` | string | `title` | ✓ |
| `description` | optional | `description` | ✓ |
| `ai` | bool (default true) | `ai` | ✓ |
| `sub_epics[]` | … | `ai_api_subepic` | ✓ |
| `user_stories[]` | … | `ai_api_userstory` | ✓ |
| `tasks[]` | `{ title, status, ai }` | `ai_api_storytask` | ✓ |

**Conclusion:** CLI + `generated_parsers` outputs are **ready to persist** using the same shapes `saveOverviewToDb` / `saveBacklogToDb` expect.

## FastAPI microservice ([main.py](main.py))

The HTTP service uses **different inference code** than the notebook/CLI path:

- **POST `/generate-overview`** → [routers/overview.py](routers/overview.py) → `llms.project_llm.run_pipeline_from_text` + `model_to_dict`.
- **POST `/generate-backlog`** → [routers/backlog.py](routers/backlog.py) → `llms.backlog_llm.run_backlog_pipeline`.

`model_to_dict` ([project_llm.py](llms/project_llm.py)) returns `goals` as `{title, role}` and `timeline[].goals` as **strings** per week — still compatible with `saveOverviewToDb` and with `buildPart1Timeline` in `ai.controller.js`.

Pydantic response models ([schemas/overview.py](schemas/overview.py), [schemas/backlog.py](schemas/backlog.py)) match what `callAIService` passes through to `saveOverviewToDb` / `saveBacklogToDb`.

**Implication:** Backend **can** receive and store responses from the current FastAPI service. For **parity** with your tuned `notebook_step_inference` + `generated_parsers` tests, the routers would need to call that pipeline (or share one implementation) — quality may differ until then.

## Backend request/response flow

1. `PUT .../generate-overview` → `callAIService('/generate-overview', { proposal_text })` → save overview.
2. `PUT .../generate-backlog` → overview JSON → `part1_json` built in controller → `callAIService('/generate-backlog', { part1_json })` → `saveBacklogToDb`.

`part1_json` shape matches [overview_dict_to_part1_json](generated_parsers.py) (`summary`, `roles`, `features`, `goals` as `{epic, role}`, `timeline` as `week1`…`week4` arrays).
