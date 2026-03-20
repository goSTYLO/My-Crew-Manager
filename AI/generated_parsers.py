"""
Parse plain-text AI outputs into JSON-ready dicts aligned with ai.controller.js
and Prisma schema (saveOverviewToDb, saveBacklogToDb).
"""
from __future__ import annotations

import json
import re
from typing import Any


def _extract_sections(text: str) -> dict[str, str]:
    """Extract overview sections by heading patterns."""
    patterns = {
        "title": r"^Title\s*:\s*(.+)$",
        "summary": r"^Summary\s*:\s*([\s\S]*?)(?=^Roles\s*:|\Z)",
        "roles": r"^Roles\s*:\s*([\s\S]*?)(?=^Features\s*:|\Z)",
        "features": r"^Features\s*:\s*([\s\S]*?)(?=^Goals\s*:|\Z)",
        "goals": r"^Goals\s*:\s*([\s\S]*?)(?=^Timeline\s*:|\Z)",
        "timeline": r"^Timeline\s*:\s*([\s\S]*)",
    }
    out: dict[str, str] = {}
    for key, pat in patterns.items():
        m = re.search(pat, text, re.MULTILINE | re.IGNORECASE)
        if m:
            out[key] = m.group(1).strip()
    week_lines = re.findall(r"(?im)^\s*Week\s*[1-4]\s*:\s*.+$", text)
    if ("timeline" not in out or not out.get("timeline")) and week_lines:
        out["timeline"] = "\n".join(week_lines)
    return out


def _parse_list_block(block: str) -> list[str]:
    """Extract bullet/list items from a section block."""
    items = []
    for line in (block or "").splitlines():
        t = re.sub(r"^[-*+\d.)\s]+", "", line.strip()).strip()
        if t:
            items.append(t)
    return items


def _parse_timeline_week(week_text: str) -> list[dict[str, str]]:
    """
    Parse "Week N: task1, task2" into two goals as {title}.
    Model 1 uses comma-separated tasks on one line.
    """
    goals = []
    m = re.match(r"^\s*Week\s*(\d+)\s*:\s*(.+)$", week_text.strip(), re.IGNORECASE)
    if not m:
        return goals
    body = m.group(2).strip()
    parts = [p.strip() for p in re.split(r",\s*(?=[A-Z])", body) if p.strip()]
    if not parts:
        parts = [body] if body else []
    for p in parts:
        goals.append({"title": p})
    return goals


def parse_overview_text(text: str) -> dict[str, Any]:
    """
    Parse Model 1 overview plain text into a dict matching saveOverviewToDb input.
    Returns: { title, summary, features, roles, goals, timeline }
    - goals: list of { title, role } (role optional)
    - timeline: list of { week_number, goals: [{ title }] }
    """
    sections = _extract_sections(text or "")
    title = (sections.get("title") or "").strip()
    summary = (sections.get("summary") or "").strip()
    features = _parse_list_block(sections.get("features", ""))
    roles = _parse_list_block(sections.get("roles", ""))

    goal_items = _parse_list_block(sections.get("goals", ""))
    goals = []
    for g in goal_items:
        if isinstance(g, dict):
            goals.append({"title": g.get("title", ""), "role": g.get("role")})
        else:
            goals.append({"title": str(g), "role": None})

    timeline = []
    timeline_block = sections.get("timeline", "")
    for line in timeline_block.splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^\s*Week\s*(\d+)\s*:\s*(.+)$", line, re.IGNORECASE)
        if m:
            week_num = int(m.group(1))
            goals_list = _parse_timeline_week(line)
            if not goals_list:
                body = m.group(2).strip()
                if body:
                    goals_list = [{"title": body}]
            timeline.append({"week_number": week_num, "goals": goals_list})

    return {
        "title": title or None,
        "summary": summary or None,
        "features": features,
        "roles": roles,
        "goals": goals,
        "timeline": timeline,
    }


_TRAINING_PART1_HEADER = re.compile(
    r"^(Summary|Roles|Features|Goals|Timeline)\s*:\s*$", re.I
)


def parse_training_part1_to_overview(text: str) -> dict[str, Any]:
    """
    Parse Model 2 JSONL `prompt` field: `=== Title ===`, then Summary:/Roles:/… with
    one list item per line (no leading bullets). Returns the same shape as
    parse_overview_text for `overview_dict_to_model2_training_prompt`.
    """
    text = (text or "").strip()
    if not text:
        return parse_overview_text("")

    lines = text.splitlines()
    idx = 0
    title: str | None = None
    if idx < len(lines) and re.match(r"^===\s*.+?\s*===\s*$", lines[idx].strip()):
        m = re.match(r"^===\s*(.+?)\s*===\s*$", lines[idx].strip())
        title = (m.group(1).strip() if m else None) or None
        idx += 1

    headers: dict[str, int] = {}
    for j in range(idx, len(lines)):
        if _TRAINING_PART1_HEADER.match(lines[j].strip()):
            name = _TRAINING_PART1_HEADER.match(lines[j].strip()).group(1).lower()
            headers[name] = j

    order = ["summary", "roles", "features", "goals", "timeline"]

    def slice_section(name: str) -> str:
        start = headers.get(name)
        if start is None:
            return ""
        cstart = start + 1
        cend = len(lines)
        try:
            pos = order.index(name)
        except ValueError:
            return ""
        for nxt in order[pos + 1 :]:
            if nxt in headers:
                cend = headers[nxt]
                break
        return "\n".join(lines[cstart:cend]).strip()

    summary = slice_section("summary")
    roles_block = slice_section("roles")
    features_block = slice_section("features")
    goals_block = slice_section("goals")
    timeline_block = slice_section("timeline")

    def plain_lines(block: str) -> list[str]:
        out: list[str] = []
        for line in block.splitlines():
            t = re.sub(r"^[-*+\d.)\s]+", "", line.strip()).strip()
            if t:
                out.append(t)
        return out

    roles = plain_lines(roles_block)
    features = plain_lines(features_block)
    goals = [{"title": g, "role": None} for g in plain_lines(goals_block)]

    timeline: list[dict[str, Any]] = []
    for line in timeline_block.splitlines():
        line = line.strip()
        if not line:
            continue
        m = re.match(r"^\s*Week\s*(\d+)\s*:\s*(.+)$", line, re.I)
        if m:
            week_num = int(m.group(1))
            goals_list = _parse_timeline_week(line)
            timeline.append({"week_number": week_num, "goals": goals_list})

    return {
        "title": title,
        "summary": summary or None,
        "features": features,
        "roles": roles,
        "goals": goals,
        "timeline": timeline,
    }


def overview_dict_to_model2_training_prompt(overview: dict[str, Any]) -> str:
    """
    Convert overview dict (from parse_overview_text or API/DB) to the plain-text
    format used in model2_part1_to_backlog_epic_v1.jsonl prompts. Matches training
    distribution for Model 2 backlog generation.
    """
    title = (overview.get("title") or "").strip() or "Untitled Project"
    summary = (overview.get("summary") or "").strip()
    roles = overview.get("roles") or []
    features = overview.get("features") or []
    goals_raw = overview.get("goals") or []
    timeline = overview.get("timeline") or []

    def _str_list(items: list) -> list[str]:
        out = []
        for x in items:
            if isinstance(x, str):
                t = x.strip()
                if t:
                    out.append(t)
            elif isinstance(x, dict):
                t = (x.get("title") or x.get("epic") or "").strip()
                if t:
                    out.append(t)
            else:
                t = str(x).strip()
                if t:
                    out.append(t)
        return out

    goals = _str_list(goals_raw)
    roles = _str_list(roles)
    features = _str_list(features)

    lines = [f"=== {title} ===", "Summary:", summary, ""]
    lines.append("Roles:")
    lines.extend(roles if roles else [""])
    lines.append("")
    lines.append("Features:")
    lines.extend(features if features else [""])
    lines.append("")
    lines.append("Goals:")
    lines.extend(goals if goals else [""])
    lines.append("")
    lines.append("Timeline:")

    for w in sorted(timeline, key=lambda x: (x.get("week_number", 0) if isinstance(x, dict) else 0)):
        week_num = w.get("week_number", 0) if isinstance(w, dict) else 0
        goals_in_week = (w.get("goals", []) if isinstance(w, dict) else []) or []
        tasks = []
        for g in goals_in_week:
            if isinstance(g, str):
                tasks.append(g.strip())
            elif isinstance(g, dict):
                t = (g.get("title") or "").strip()
                if t:
                    tasks.append(t)
            else:
                t = str(g).strip()
                if t:
                    tasks.append(t)
        week_line = f"Week {week_num}: " + ", ".join(tasks) if tasks else f"Week {week_num}:"
        lines.append(week_line)

    return "\n".join(lines).strip()


def overview_dict_to_part1_json(overview: dict[str, Any]) -> str:
    """
    Convert parsed overview dict to part1_json string for Model 2 (backlog) input.
    Mirrors buildPart1Timeline and generateBacklog part1 shape in ai.controller.js.
    """
    goals = (overview.get("goals") or [])
    goals_part1 = []
    for g in goals:
        if isinstance(g, dict):
            goals_part1.append({"epic": g.get("title", ""), "role": g.get("role") or ""})
        else:
            goals_part1.append({"epic": str(g), "role": ""})

    timeline_out = {}
    for w in overview.get("timeline") or []:
        week_num = w.get("week_number", 0) if isinstance(w, dict) else 0
        key = f"week{week_num}"
        goals_raw = (w.get("goals", []) if isinstance(w, dict) else []) or []
        tasks = []
        for g in goals_raw:
            if isinstance(g, str):
                tasks.append(g)
            elif isinstance(g, dict):
                tasks.append(g.get("title", "") or "")
            else:
                tasks.append(str(g))
        timeline_out[key] = [t for t in tasks if t]

    if not timeline_out:
        timeline_out = {"week1": [], "week2": [], "week3": [], "week4": []}

    part1 = {
        "summary": overview.get("summary") or "",
        "roles": overview.get("roles") or [],
        "features": overview.get("features") or [],
        "goals": goals_part1,
        "timeline": timeline_out,
    }
    return json.dumps(part1, ensure_ascii=False)


def _parse_backlog_hierarchy(text: str) -> list[dict]:
    """Parse flat backlog hierarchy (Epic, Sub-Epic, User Story, Task)."""
    epics = []
    current_epic = None
    current_sub = None
    current_story = None
    for raw in (text or "").splitlines():
        stripped = raw.strip()
        if not stripped:
            continue
        epic_m = re.match(r"^Epic\s*(\d+)\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if epic_m:
            current_epic = {"title": epic_m.group(2).strip(), "sub_epics": []}
            epics.append(current_epic)
            current_sub = current_story = None
            continue
        sub_m = re.match(r"^-?\s*Sub-?Epic\s*\d*\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if sub_m and current_epic:
            current_sub = {"title": sub_m.group(1).strip(), "user_stories": []}
            current_epic["sub_epics"].append(current_sub)
            current_story = None
            continue
        story_m = re.match(r"^-?\s*User\s+Story\s*\d*\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if story_m and current_sub:
            current_story = {"title": story_m.group(1).strip(), "tasks": []}
            current_sub["user_stories"].append(current_story)
            continue
        task_m = re.match(r"^-?\s*Task\s*\d*\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if task_m and current_story:
            current_story["tasks"].append({"title": task_m.group(1).strip(), "status": "pending", "ai": True})
    return epics


def parse_backlog_text(text: str) -> dict[str, Any]:
    """
    Parse Model 2 backlog plain text into a dict matching saveBacklogToDb input.
    Returns: { epics: [{ title, description?, ai?, sub_epics: [{ title, user_stories: [{ title, tasks: [{ title, status, ai }] }] }] }] }
    """
    epics_raw = _parse_backlog_hierarchy(text or "")
    epics = []
    for e in epics_raw:
        sub_epics = []
        for se in e.get("sub_epics", []):
            stories = []
            for st in se.get("user_stories", []):
                tasks = []
                for t in st.get("tasks", []):
                    task = t if isinstance(t, dict) else {"text": str(t)}
                    tasks.append({
                        "title": task.get("title", task.get("text", "")),
                        "status": task.get("status", "pending"),
                        "ai": task.get("ai", True),
                    })
                stories.append({
                    "title": st.get("title", st.get("text", "")),
                    "ai": st.get("ai", True),
                    "tasks": tasks,
                })
            sub_epics.append({
                "title": se.get("title", ""),
                "ai": se.get("ai", True),
                "user_stories": stories,
            })
        epics.append({
            "title": e.get("title", ""),
            "description": e.get("description"),
            "ai": e.get("ai", True),
            "sub_epics": sub_epics,
        })
    return {"epics": epics}


if __name__ == "__main__":
    # Smoke test with fixture snippets
    overview_fixture = """
Title: CityComm
Summary: CityComm is a web-based platform that connects residents to city services.
Roles:
- Backend Developer
- Frontend Developer
- AI Engineer
Features:
- Issue Reporting
- Service Access
- AI Categorization
Goals:
- Develop backend and frontend systems
- Implement issue reporting and AI categorisation
- Configure service access and geospatial analysis
- Test and deploy system
- Improve citizen satisfaction
Timeline:
Week 1: Define scope from goals, Design feature architecture
Week 2: Implement core backend flows, Build frontend interfaces
Week 3: Integrate modules and APIs, Validate end-to-end behavior
Week 4: Run QA and bug fixes, Deploy and monitor release
"""
    parsed = parse_overview_text(overview_fixture)
    print("Overview parse:", json.dumps(parsed, indent=2, ensure_ascii=False)[:800])
    part1 = overview_dict_to_part1_json(parsed)
    print("\nPart1 JSON (first 400 chars):", part1[:400])
    training_prompt = overview_dict_to_model2_training_prompt(parsed)
    print("\nModel2 training prompt (first 500 chars):", training_prompt[:500])

    backlog_fixture = """
Epic 1: Design lesson module
-Sub-Epic 1: Week 1 setup
-User Story 1: As a Project Manager, I want to set up the mobile app framework.
-Task 1: Install necessary dependencies
-Task 2: Set up backend APIs

Epic 2: Implement quiz system
-Sub-Epic 2: Week 2 build
-User Story 2: As a Mobile Developer, I want to build the lesson module.
-Task 1: Write code for lesson module
-Task 2: Connect to backend APIs
"""
    backlog_parsed = parse_backlog_text(backlog_fixture)
    print("\nBacklog parse:", json.dumps(backlog_parsed, indent=2, ensure_ascii=False)[:600])
