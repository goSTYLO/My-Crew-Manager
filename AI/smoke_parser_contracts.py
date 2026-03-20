"""
Smoke test: parser outputs + Node part1_json round-trip (no GPU, no FastAPI).

Run from AI/:
  python smoke_parser_contracts.py

Validates shapes aligned with backend-node saveOverviewToDb / saveBacklogToDb.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

_root = Path(__file__).resolve().parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from generated_parsers import (  # noqa: E402
    overview_dict_to_part1_json,
    parse_backlog_text,
    parse_overview_text,
    part1_json_string_to_overview_dict,
)

OVERVIEW_FIXTURE = """
Title: CityComm
Summary: CityComm connects residents to city services.
Roles:
- Backend Developer
Features:
- Issue Reporting
Goals:
- Ship MVP
- Improve satisfaction
Timeline:
Week 1: Plan scope, Design API
Week 2: Build API, Build UI
"""

BACKLOG_FIXTURE = """
Epic 1: Design lesson module
-Sub-Epic 1: Week 1 setup
-User Story 1: As a PM, I want setup.
-Task 1: Install dependencies
-Task 2: Set up APIs
"""


def _test_role_backfill_multiline() -> None:
    """Ensure Model 1 role backfill runs when Roles: uses bullet lines (regex must span newlines)."""
    try:
        from notebook_step_inference import _backfill_roles
    except ImportError:
        return
    raw = (
        "Title: E\nSummary: S\nRoles:\n"
        "- AI Engineer\n- UX Designer\n"
        "Features:\n- A\nGoals:\n- g1\n- g2\n- g3\n- g4\n- g5\n"
        "Timeline:\nWeek 1: a\nWeek 2: b\nWeek 3: c\nWeek 4: d\n"
    )
    filled = _backfill_roles(raw)
    for label in ("Project Manager", "Backend Developer", "Frontend Developer"):
        assert label in filled, f"expected backfill role {label!r} in:\n{filled}"


def main() -> None:
    _test_role_backfill_multiline()

    o = parse_overview_text(OVERVIEW_FIXTURE)
    for k in ("title", "summary", "features", "roles", "goals", "timeline"):
        assert k in o, f"missing overview key {k}"
    assert o["title"] == "CityComm"
    assert isinstance(o["timeline"], list) and len(o["timeline"]) >= 2

    part1_str = overview_dict_to_part1_json(o)
    o2 = part1_json_string_to_overview_dict(part1_str)
    assert o2 is not None, "part1_json round-trip failed"
    assert o2.get("summary") == o.get("summary")
    assert len(o2.get("goals") or []) == len(o.get("goals") or [])

    # Simulate Node controller part1 (goals with epic/role)
    node_like = json.loads(part1_str)
    assert "epic" in (node_like["goals"][0] or {})
    o3 = part1_json_string_to_overview_dict(json.dumps(node_like, ensure_ascii=False))
    assert o3 is not None

    b = parse_backlog_text(BACKLOG_FIXTURE)
    epics = b.get("epics") or []
    assert epics, "expected epics"
    e0 = epics[0]
    assert e0.get("title")
    subs = e0.get("sub_epics") or []
    assert subs and subs[0].get("user_stories")

    # Comma-joined / bracket list lines (one DB row per item after saveOverviewToDb)
    comma_overview = """
Title: X
Summary: Short
Roles:
- PM, Dev, Designer
Features:
[Venue Suggestion, Vendor Suggestion, Scheduler, Notifications]
Goals:
- Ship A, Ship B
Timeline:
Week 1: Task one, Task two
"""
    co = parse_overview_text(comma_overview)
    assert len(co["roles"]) == 3, co["roles"]
    assert len(co["features"]) == 4, co["features"]
    assert len(co["goals"]) == 2, co["goals"]

    # Model 1 sometimes omits newline before the next header ("DeveloperFeatures:")
    glued_features = """
Title: EventEase
Summary: AI event planning.
Roles:
- AI Engineer
- UX Designer
- Frontend DeveloperFeatures:
- Venue Suggestion
- Vendor Suggestion
- Scheduler
- Notifications
Goals:
- Plan wedding venues
- Select vendors
- Schedule events
- Send reminders
- Ship MVP
Timeline:
Week 1: A, B
Week 2: C, D
Week 3: E, F
Week 4: G, H
"""
    gf = parse_overview_text(glued_features)
    assert "Frontend Developer" in (gf.get("roles") or []), gf["roles"]
    assert "Venue Suggestion" in (gf.get("features") or []), gf["features"]
    assert not any("Features:" in r for r in (gf.get("roles") or [])), gf["roles"]
    assert len(gf.get("features") or []) >= 4, gf["features"]

    task_split_backlog = """
Epic 1: E
-Sub-Epic 1: S
-User Story 1: US
-Task 1: First task, Second task, Third
"""
    ts = parse_backlog_text(task_split_backlog)
    tasks = (ts["epics"][0]["sub_epics"][0]["user_stories"][0].get("tasks") or [])
    assert len(tasks) == 3, tasks

    print("smoke_parser_contracts: OK")


if __name__ == "__main__":
    main()
