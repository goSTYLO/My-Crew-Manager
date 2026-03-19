"""Build strict Epic/Sub-Epic/User Story/Task Model 2 dataset from v3 Goal-format dataset.

Input:
- model2_part1_to_backlog_v3.jsonl (Goal/User Story/Tasks text)

Output:
- model2_part1_to_backlog_epic_v1.jsonl (Epic/Sub-Epic/User Story/Task text)

The converter preserves the original prompt and rewrites response into a strict hierarchy.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent
SOURCE = DATASET_DIR / "model2_part1_to_backlog_v3.jsonl"
TARGET = DATASET_DIR / "model2_part1_to_backlog_epic_v1.jsonl"


def _parse_prompt_sections(prompt_text: str) -> dict[str, list[str] | str]:
    roles: list[str] = []
    features: list[str] = []
    title = ""

    lines = prompt_text.splitlines()
    current = ""
    for raw in lines:
        line = raw.strip()
        if not line:
            continue

        title_match = re.match(r"^===\s*(.+?)\s*===\s*$", line)
        if title_match:
            title = title_match.group(1).strip()
            current = ""
            continue

        lower = line.lower().rstrip(":")
        if lower in {"roles", "features", "goals", "timeline", "summary"}:
            current = lower
            continue

        if current == "roles":
            roles.append(line.lstrip("- ").strip())
        elif current == "features":
            features.append(line.lstrip("- ").strip())

    return {"title": title, "roles": roles, "features": features}


def _extract_goal_blocks(backlog_text: str) -> list[dict]:
    blocks = []
    current_goal: dict | None = None

    for raw in backlog_text.splitlines():
        line = raw.strip()
        if not line:
            continue

        if re.match(r"(?im)^backlog\s*:\s*$", line):
            continue

        m_goal = re.match(r"(?i)^goal\s*:?\s*(.+)$", line)
        if m_goal:
            if current_goal is not None:
                blocks.append(current_goal)
            current_goal = {"goal": m_goal.group(1).strip(), "story": "", "tasks": []}
            continue

        if current_goal is None:
            continue

        m_story = re.match(r"(?i)^-?\s*user\s*story\s*:?\s*(.+)$", line)
        if m_story:
            current_goal["story"] = m_story.group(1).strip()
            continue

        m_task = re.match(r"(?i)^-?\s*task[s]?\s*:?\s*(.+)$", line)
        if m_task:
            body = m_task.group(1).strip()
            # Support either "Tasks: a, b" or "Task: a"
            if "," in body:
                parts = [p.strip() for p in body.split(",") if p.strip()]
                current_goal["tasks"].extend(parts)
            else:
                current_goal["tasks"].append(body)
            continue

        # Also support numbered task lines from previously normalized outputs.
        m_numbered_task = re.match(r"(?i)^-?\s*task\s*\d+(?:\.\d+)*\s*:\s*(.+)$", line)
        if m_numbered_task:
            current_goal["tasks"].append(m_numbered_task.group(1).strip())

    if current_goal is not None:
        blocks.append(current_goal)

    return blocks


def _fallback_story(goal_title: str) -> str:
    lowered = goal_title.lower()
    if "test" in lowered or "qa" in lowered:
        return f"As a QA Engineer, I want to validate {goal_title.lower()} so that delivery quality remains high"
    if "ai" in lowered or "model" in lowered:
        return f"As an AI Engineer, I want to implement {goal_title.lower()} so that the system provides intelligent outcomes"
    if "api" in lowered or "backend" in lowered:
        return f"As a Backend Developer, I want to implement {goal_title.lower()} so that core services are reliable"
    return f"As a Project Team Member, I want to implement {goal_title.lower()} so that project goals are delivered"


def _pick_role(goal_title: str, roles: list[str]) -> str:
    if not roles:
        return "Project Team Member"

    lowered_goal = goal_title.lower()
    preferred = [
        ("qa", ["qa", "quality", "test"]),
        ("ai", ["ai", "model", "predict", "recommend"]),
        ("backend", ["api", "backend", "database", "integration"]),
        ("frontend", ["ui", "dashboard", "screen", "interface", "frontend"]),
    ]
    for role_key, words in preferred:
        if any(word in lowered_goal for word in words):
            for role in roles:
                role_low = role.lower()
                if role_key in role_low or (role_key == "qa" and "quality" in role_low):
                    return role

    return roles[0]


def _derive_sub_epic_title(goal_title: str, features: list[str], fallback_title: str) -> str:
    lowered_goal = goal_title.lower()
    for feature in features:
        feat = feature.strip()
        if not feat:
            continue
        feat_low = feat.lower()
        if any(token in lowered_goal for token in feat_low.split()[:2]):
            return f"Implement {feat} workflow"

    if any(word in lowered_goal for word in ["test", "qa", "validate"]):
        return "Quality validation and release readiness"
    if any(word in lowered_goal for word in ["ai", "model", "recommend", "predict"]):
        return "Intelligence layer implementation"
    if any(word in lowered_goal for word in ["api", "backend", "data", "integrat"]):
        return "Backend service and integration delivery"
    if any(word in lowered_goal for word in ["ui", "dashboard", "frontend", "interface"]):
        return "User-facing experience delivery"
    if fallback_title:
        return f"Delivery stream for {fallback_title}"
    return f"Core delivery for {goal_title}"


def _normalize_story_text(story: str, goal_title: str, picked_role: str) -> str:
    cleaned = story.strip().rstrip(".")
    if cleaned.lower().startswith("as a "):
        return cleaned
    return f"As a {picked_role}, I want to deliver {goal_title.lower()} so that project outcomes are achieved"


def _normalize_two_tasks(tasks: list[str], goal_title: str) -> list[str]:
    cleaned = [t.strip().rstrip(".") for t in tasks if t.strip()]
    if len(cleaned) >= 2:
        return cleaned[:2]
    if len(cleaned) == 1:
        cleaned.append(f"Validate and document {goal_title.lower()}")
        return cleaned
    return [
        f"Implement core deliverable for {goal_title.lower()}",
        f"Validate and document {goal_title.lower()}",
    ]


def _goal_to_epic_response(goal_blocks: list[dict], prompt_meta: dict[str, list[str] | str]) -> str:
    if not goal_blocks:
        # Ensure minimum structure even for malformed rows.
        goal_blocks = [
            {
                "goal": "Core Platform Delivery",
                "story": "As a Project Team Member, I want core platform delivery so that baseline functionality is available",
                "tasks": ["Implement baseline modules", "Validate baseline behavior"],
            }
        ]

    lines: list[str] = []
    roles = [r for r in prompt_meta.get("roles", []) if isinstance(r, str)]
    features = [f for f in prompt_meta.get("features", []) if isinstance(f, str)]
    prompt_title = str(prompt_meta.get("title", "")).strip()

    for i, block in enumerate(goal_blocks, start=1):
        goal_title = block.get("goal", "Untitled Goal").strip() or "Untitled Goal"
        picked_role = _pick_role(goal_title, roles)
        story = _normalize_story_text(
            block.get("story", "").strip() or _fallback_story(goal_title),
            goal_title,
            picked_role,
        )
        sub_epic_title = _derive_sub_epic_title(goal_title, features, prompt_title)
        tasks = _normalize_two_tasks(block.get("tasks", []), goal_title)

        lines.append(f"Epic {i}: {goal_title} *(covers: {goal_title})*")
        lines.append(f" -Sub-Epic {i}.1: {sub_epic_title}")
        lines.append(f"  -User Story {i}.1.1: {story}")
        lines.append(f"   -Task {i}.1.1.1: {tasks[0]}")
        lines.append(f"   -Task {i}.1.1.2: {tasks[1]}")

    return "\n".join(lines).strip()


def _validate_epic_response(response: str) -> tuple[bool, str]:
    epics = []
    current_epic_idx = None
    sub_count = story_count = task_count = 0

    for line in response.splitlines():
        s = line.strip()
        m_epic = re.match(r"(?i)^epic\s*(\d+)\s*:\s+.+$", s)
        if m_epic:
            if current_epic_idx is not None and not (sub_count == 1 and story_count == 1 and task_count == 2):
                return False, f"Epic {current_epic_idx} has invalid cardinality (sub={sub_count}, story={story_count}, task={task_count})"
            current_epic_idx = int(m_epic.group(1))
            epics.append(current_epic_idx)
            sub_count = story_count = task_count = 0
            continue

        if re.match(r"(?i)^-?\s*sub-?epic\s*\d+\.\d+\s*:\s+.+$", s):
            sub_count += 1
            continue
        if re.match(r"(?i)^-?\s*user\s*story\s*\d+(?:\.\d+)*\s*:\s+.+$", s):
            story_count += 1
            continue
        if re.match(r"(?i)^-?\s*task\s*\d+(?:\.\d+)*\s*:\s+.+$", s):
            task_count += 1
            continue

    if current_epic_idx is not None and not (sub_count == 1 and story_count == 1 and task_count == 2):
        return False, f"Epic {current_epic_idx} has invalid cardinality (sub={sub_count}, story={story_count}, task={task_count})"

    if not (4 <= len(epics) <= 6):
        return False, f"Epic count out of range: {len(epics)}"

    return True, "ok"


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source dataset: {SOURCE}")

    input_rows = []
    for line_no, raw in enumerate(SOURCE.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.strip()
        if not line:
            continue
        try:
            input_rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Malformed JSON at line {line_no}: {exc}") from exc

    output_rows = []
    failures = []

    for idx, row in enumerate(input_rows, start=1):
        prompt = (row.get("prompt") or "").strip()
        response = (row.get("response") or "").strip()

        if not prompt or not response:
            failures.append((idx, "missing_prompt_or_response"))
            continue

        goals = _extract_goal_blocks(response)
        prompt_meta = _parse_prompt_sections(prompt)
        epic_response = _goal_to_epic_response(goals, prompt_meta)
        ok, reason = _validate_epic_response(epic_response)
        if not ok:
            failures.append((idx, reason))
            continue

        output_rows.append({"prompt": prompt, "response": epic_response})

    with open(TARGET, "w", encoding="utf-8") as f:
        for row in output_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Source rows: {len(input_rows)}")
    print(f"Output rows: {len(output_rows)}")
    print(f"Failures: {len(failures)}")
    if failures:
        print("First 10 failures:")
        for row_idx, reason in failures[:10]:
            print(f"- row {row_idx}: {reason}")
    print(f"Wrote: {TARGET}")


if __name__ == "__main__":
    main()
