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

**List sections (`_parse_list_block`):** If the model puts multiple features, roles, or goals on one line (comma-separated) or in brackets like `[A, B, C]`, the parser splits them so each string becomes its own Prisma row (`ai_api_projectfeature`, `ai_api_projectrole`, `ai_api_projectgoal`).

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

## Node `part1_json` → overview dict

[`part1_json_string_to_overview_dict`](generated_parsers.py) converts the JSON string built in `ai.controller.js` (`summary`, `roles`, `features`, `goals` with `{ epic, role }`, `timeline` with `week1`…`weekN`) into the same overview-shaped dict used by `generate_backlog_from_part1`, so Model 2 always receives the training-style Part 1 prompt.

## FastAPI microservice ([main.py](main.py))

Routers [`routers/overview.py`](routers/overview.py) and [`routers/backlog.py`](routers/backlog.py) call **`notebook_step_inference`** (Model 1 / Model 2 LoRA) and **`generated_parsers`** to produce JSON responses aligned with the Node controller. The older **`llms/`** package (`project_llm`, `backlog_llm`) is no longer used by these HTTP endpoints (still in the repo for reference or scripts).

Pydantic response models ([schemas/overview.py](schemas/overview.py), [schemas/backlog.py](schemas/backlog.py)) match what `callAIService` passes through to `saveOverviewToDb` / `saveBacklogToDb`.

## Backend request/response flow

1. `PUT .../generate-overview` → `callAIService('/generate-overview', { proposal_text })` → save overview.
2. `PUT .../generate-backlog` → overview JSON → `part1_json` built in controller → `callAIService('/generate-backlog', { part1_json })` → `saveBacklogToDb`.

`part1_json` shape matches [overview_dict_to_part1_json](generated_parsers.py) (`summary`, `roles`, `features`, `goals` as `{epic, role}`, `timeline` as `week1`…`week4` arrays).
