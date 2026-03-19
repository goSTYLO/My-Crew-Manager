"""Build text-first training datasets from delimiter-based proposal files.

Source priority:
1) goal_ai_output.txt (source of truth)
2) combined_dataset_model1_and_2.txt (supplemental)

Outputs:
- combined.json
- model1_description_to_part1.jsonl
- model2_part1_to_backlog.jsonl
- conversion_report.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATASET_DIR = ROOT / "dataset"
DEFAULT_SOURCE_TRUTH = DATASET_DIR / "goal_ai_output.txt"
DEFAULT_SOURCE_SUPPLEMENTAL = DATASET_DIR / "combined_dataset_model1_and_2.txt"

SECTION_HEADERS = [
    "Summary",
    "Status",
    "Proposal / Input",
    "Roles",
    "Features",
    "Goals",
    "Timeline",
    "Backlog",
]


def clean_text(text: str) -> str:
    text = text.replace("\u2019", "'")
    text = text.replace("\u2013", "-")
    text = text.replace("\u2014", "-")
    return re.sub(r"\s+", " ", text).strip()


def split_csv_or_lines(text: str) -> list[str]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if len(lines) == 1:
        single = re.sub(r"^[-*]\s*", "", lines[0]).strip()
        if "," in single:
            values = [clean_text(v) for v in single.split(",")]
            return [v for v in values if v]
        return [clean_text(single)] if clean_text(single) else []

    out: list[str] = []
    for ln in lines:
        item = clean_text(re.sub(r"^[-*]\s*", "", ln).strip())
        if item:
            out.append(item)
    return out


def parse_timeline(text: str) -> dict[str, list[str]]:
    timeline: dict[str, list[str]] = {}
    for ln in text.splitlines():
        s = ln.strip()
        if not s:
            continue
        m = re.match(r"^Week\s*(\d+)\s*:\s*(.+)$", s, re.IGNORECASE)
        if not m:
            continue
        week_num = int(m.group(1))
        tasks_raw = m.group(2)
        tasks = [clean_text(x) for x in re.split(r",\s*", tasks_raw) if clean_text(x)]
        if len(tasks) < 2:
            tasks.extend(["Refine implementation details"] * (2 - len(tasks)))
        if len(tasks) > 2:
            tasks = tasks[:2]
        timeline[f"week{week_num}"] = tasks

    for idx in range(1, 5):
        wk = f"week{idx}"
        if wk not in timeline:
            timeline[wk] = ["Refine implementation details", "Review progress"]
    return timeline


def split_blocks(text: str) -> list[tuple[str, str]]:
    blocks: list[tuple[str, str]] = []
    current_title: str | None = None
    current_lines: list[str] = []

    for raw in text.splitlines():
        line = raw.rstrip("\n")
        title_match = re.match(r"^===\s*(.+?)\s*===\s*$", line)
        if title_match:
            if current_title is not None:
                blocks.append((current_title, "\n".join(current_lines).strip()))
            current_title = clean_text(title_match.group(1))
            current_lines = []
            continue

        if line.strip() == "===" and current_title is not None:
            blocks.append((current_title, "\n".join(current_lines).strip()))
            current_title = None
            current_lines = []
            continue

        if current_title is not None:
            current_lines.append(line)

    if current_title is not None:
        blocks.append((current_title, "\n".join(current_lines).strip()))
    return [(t, b) for t, b in blocks if t and b]


def parse_sections(body: str) -> dict[str, str]:
    header_pattern = r"^(Summary|Status|Proposal / Input|Roles|Features|Goals|Timeline|Backlog):\s*(.*)$"
    section_re = re.compile(header_pattern, re.IGNORECASE)

    sections: dict[str, list[str]] = {}
    current: str | None = None

    for ln in body.splitlines():
        m = section_re.match(ln.strip())
        if m:
            header = m.group(1)
            header = next((h for h in SECTION_HEADERS if h.lower() == header.lower()), header)
            current = header
            sections.setdefault(current, [])
            if m.group(2).strip():
                sections[current].append(m.group(2).strip())
            continue
        if current is not None:
            sections[current].append(ln.rstrip())

    return {k: "\n".join(v).strip() for k, v in sections.items()}


def parse_goals(text: str, roles: list[str]) -> list[dict[str, str]]:
    goal_lines = split_csv_or_lines(text)
    out: list[dict[str, str]] = []
    fallback_role = roles[0] if roles else "Project Manager"
    for g in goal_lines:
        if not g:
            continue
        role_match = re.search(r"\(([^)]+)\)\s*$", g)
        role = clean_text(role_match.group(1)) if role_match else fallback_role
        epic = clean_text(re.sub(r"\(([^)]+)\)\s*$", "", g)).rstrip(".")
        if epic:
            out.append({"epic": epic, "role": role})
    return out


def choose_goal_title(epic_title: str, cover_title: str, goals: list[dict[str, str]], idx: int) -> str:
    if cover_title:
        return clean_text(cover_title)

    epic_norm = clean_text(epic_title).lower()
    for g in goals:
        if clean_text(g["epic"]).lower() == epic_norm:
            return g["epic"]
    if idx < len(goals):
        return goals[idx]["epic"]
    return clean_text(epic_title)


def parse_backlog_to_goal_format(backlog_text: str, goals: list[dict[str, str]]) -> str:
    lines = [ln.rstrip() for ln in backlog_text.splitlines() if ln.strip()]
    if not lines:
        return ""

    goal_blocks: list[dict[str, object]] = []
    current_goal: dict[str, object] | None = None

    def flush_current() -> None:
        nonlocal current_goal
        if current_goal is None:
            return
        tasks = current_goal.get("tasks", [])
        if not isinstance(tasks, list):
            tasks = []
        tasks = [clean_text(str(t)) for t in tasks if clean_text(str(t))]
        if len(tasks) < 2:
            base = clean_text(str(current_goal.get("title", "goal implementation"))).lower()
            tasks.extend([f"Implement {base}", f"Validate {base}"])
        current_goal["tasks"] = tasks[:2]

        story = clean_text(str(current_goal.get("story", "")))
        if not story:
            idx = int(current_goal.get("idx", 1)) - 1
            role = goals[idx]["role"] if idx < len(goals) else "team member"
            goal_title = clean_text(str(current_goal.get("title", "goal implementation"))).lower()
            story = f"As a {role}, I want to deliver {goal_title}"
        current_goal["story"] = story

        goal_blocks.append(current_goal)
        current_goal = None

    for ln in lines:
        s = ln.strip()

        goal_match = re.match(r"^Goal\s*(\d+)?\s*:\s*(.+)$", s, re.IGNORECASE)
        epic_match = re.match(r"^Epic\s*(\d+)?\s*:\s*(.+)$", s, re.IGNORECASE)

        if goal_match or epic_match:
            flush_current()
            if goal_match:
                idx = int(goal_match.group(1)) if goal_match.group(1) else len(goal_blocks) + 1
                title = clean_text(goal_match.group(2))
                current_goal = {"idx": idx, "title": title, "story": "", "tasks": []}
            else:
                idx = int(epic_match.group(1)) if epic_match.group(1) else len(goal_blocks) + 1
                raw = clean_text(epic_match.group(2))
                cover = ""
                cover_match = re.search(r"\*\(covers:\s*(.+?)\)\*", raw, re.IGNORECASE)
                if cover_match:
                    cover = clean_text(cover_match.group(1))
                    raw = clean_text(re.sub(r"\s*\*\(covers:\s*.+?\)\*\s*$", "", raw, flags=re.IGNORECASE))
                title = choose_goal_title(raw, cover, goals, idx - 1)
                current_goal = {"idx": idx, "title": title, "story": "", "tasks": []}
            continue

        if current_goal is None:
            continue

        story_match = re.match(r"^-?\s*User Story(?:\s*[\d.]+)?\s*:\s*(.+)$", s, re.IGNORECASE)
        if story_match:
            current_goal["story"] = clean_text(story_match.group(1))
            continue

        task_line = re.match(r"^-?\s*Task(?:\s*[\d.]+)?\s*:\s*(.+)$", s, re.IGNORECASE)
        if task_line:
            cast_tasks = current_goal.setdefault("tasks", [])
            if isinstance(cast_tasks, list):
                cast_tasks.append(clean_text(task_line.group(1)))
            continue

        tasks_line = re.match(r"^Tasks\s*:\s*(.+)$", s, re.IGNORECASE)
        if tasks_line:
            cast_tasks = current_goal.setdefault("tasks", [])
            if isinstance(cast_tasks, list):
                for item in re.split(r",\s*", tasks_line.group(1)):
                    if clean_text(item):
                        cast_tasks.append(clean_text(item))
            continue

    flush_current()

    if not goal_blocks:
        for idx, g in enumerate(goals, start=1):
            title = g["epic"]
            role = g["role"]
            goal_blocks.append(
                {
                    "idx": idx,
                    "title": title,
                    "story": f"As a {role}, I want to deliver {title.lower()}",
                    "tasks": [f"Implement {title.lower()}", f"Validate {title.lower()}"],
                }
            )

    # Ensure every declared goal has a corresponding backlog block.
    normalized_titles = {clean_text(str(g.get("title", ""))).lower() for g in goal_blocks}
    for g in goals:
        goal_title = clean_text(g["epic"])
        if goal_title.lower() in normalized_titles:
            continue
        role = clean_text(g.get("role", "team member"))
        goal_blocks.append(
            {
                "idx": len(goal_blocks) + 1,
                "title": goal_title,
                "story": f"As a {role}, I want to deliver {goal_title.lower()}",
                "tasks": [f"Implement {goal_title.lower()}", f"Validate {goal_title.lower()}"],
            }
        )
        normalized_titles.add(goal_title.lower())

    out_lines: list[str] = []
    for idx, g in enumerate(goal_blocks, start=1):
        title = clean_text(str(g.get("title", f"Goal {idx}")))
        story = clean_text(str(g.get("story", "")))
        tasks = g.get("tasks", [])
        if not isinstance(tasks, list):
            tasks = []
        task1 = clean_text(str(tasks[0])) if len(tasks) > 0 else f"Implement {title.lower()}"
        task2 = clean_text(str(tasks[1])) if len(tasks) > 1 else f"Validate {title.lower()}"

        out_lines.append(f"Goal {idx}: {title}")
        out_lines.append(f"  -User Story {idx}.1: {story}")
        out_lines.append(f"    -Task {idx}.1.1: {task1}")
        out_lines.append(f"    -Task {idx}.1.2: {task2}")

    return "\n".join(out_lines)


def build_model1_response_text(title: str, part1_output: dict) -> str:
    summary = clean_text(str(part1_output.get("summary", "")))
    roles = part1_output.get("roles", []) if isinstance(part1_output.get("roles"), list) else []
    features = part1_output.get("features", []) if isinstance(part1_output.get("features"), list) else []
    goals = part1_output.get("goals", []) if isinstance(part1_output.get("goals"), list) else []
    timeline = part1_output.get("timeline", {}) if isinstance(part1_output.get("timeline"), dict) else {}

    lines: list[str] = [f"=== {clean_text(title)} ==="]
    lines.append("Summary:")
    lines.append(summary)
    lines.append("")

    lines.append("Roles:")
    for role in roles:
        lines.append(f"- {clean_text(str(role))}")
    lines.append("")

    lines.append("Features:")
    for feat in features:
        lines.append(f"- {clean_text(str(feat))}")
    lines.append("")

    lines.append("Goals:")
    for goal in goals:
        if not isinstance(goal, dict):
            continue
        epic = clean_text(str(goal.get("epic", "")))
        role = clean_text(str(goal.get("role", "")))
        if epic and role:
            lines.append(f"- {epic} ({role})")
        elif epic:
            lines.append(f"- {epic}")
    lines.append("")

    lines.append("Timeline:")
    for wk in ["week1", "week2", "week3", "week4"]:
        week_label = wk.replace("week", "Week ")
        tasks = timeline.get(wk, []) if isinstance(timeline, dict) else []
        if not isinstance(tasks, list):
            tasks = []
        cleaned = [clean_text(str(t)) for t in tasks if clean_text(str(t))]
        if len(cleaned) < 2:
            cleaned.extend(["Refine implementation details"] * (2 - len(cleaned)))
        lines.append(f"{week_label}: {cleaned[0]}, {cleaned[1]}")

    return "\n".join(lines).strip()


def validate_part1(part1: dict) -> bool:
    if not isinstance(part1, dict):
        return False
    if not clean_text(str(part1.get("title", ""))):
        return False
    if not clean_text(str(part1.get("summary", ""))):
        return False
    roles = part1.get("roles")
    features = part1.get("features")
    goals = part1.get("goals")
    timeline = part1.get("timeline")
    if not isinstance(roles, list) or not roles:
        return False
    if not isinstance(features, list) or not features:
        return False
    if not isinstance(goals, list) or not goals:
        return False
    if not isinstance(timeline, dict):
        return False
    for g in goals:
        if not isinstance(g, dict):
            return False
        if not clean_text(str(g.get("epic", ""))):
            return False
        if not clean_text(str(g.get("role", ""))):
            return False
    for wk in ["week1", "week2", "week3", "week4"]:
        if wk not in timeline or not isinstance(timeline[wk], list) or len(timeline[wk]) < 2:
            return False
    return True


def validate_backlog(backlog_text: str, expected_goals: int) -> bool:
    if not clean_text(backlog_text):
        return False

    goal_starts = [ln for ln in backlog_text.splitlines() if re.match(r"^Goal\s*\d+\s*:", ln.strip(), re.IGNORECASE)]
    user_stories = [ln for ln in backlog_text.splitlines() if re.match(r"^-?\s*User Story\s*[\d.]*\s*:", ln.strip(), re.IGNORECASE)]
    tasks = [ln for ln in backlog_text.splitlines() if re.match(r"^-?\s*Task\s*[\d.]*\s*:", ln.strip(), re.IGNORECASE)]

    if not goal_starts:
        return False
    if expected_goals > 0 and len(goal_starts) != expected_goals:
        return False
    if len(user_stories) != len(goal_starts):
        return False
    if len(tasks) != len(goal_starts) * 2:
        return False
    return True


def parse_entry(title: str, body: str) -> tuple[dict | None, str | None]:
    sections = parse_sections(body)

    required = ["Summary", "Proposal / Input", "Roles", "Features", "Goals", "Timeline", "Backlog"]
    for key in required:
        if key not in sections or not clean_text(sections[key]):
            return None, f"Missing required section: {key}"

    proposal_input = clean_text(sections["Proposal / Input"])
    summary = clean_text(sections["Summary"])
    roles = split_csv_or_lines(sections["Roles"])
    features = split_csv_or_lines(sections["Features"])
    goals = parse_goals(sections["Goals"], roles)
    timeline = parse_timeline(sections["Timeline"])

    if not goals:
        return None, "Goals section could not be parsed"

    part1_output = {
        "title": clean_text(title),
        "summary": summary,
        "roles": roles,
        "features": features,
        "goals": goals,
        "timeline": timeline,
    }

    if not validate_part1(part1_output):
        return None, "Part1 validation failed"

    backlog_text = parse_backlog_to_goal_format(sections["Backlog"], goals)
    if not validate_backlog(backlog_text, expected_goals=len(goals)):
        return None, "Backlog validation failed"

    model1_text = build_model1_response_text(clean_text(title), part1_output)

    entry = {
        "title": clean_text(title),
        "description": proposal_input,
        "part1_output": part1_output,
        "part1_text": model1_text,
        "part2_output": backlog_text,
    }
    return entry, None


def parse_source_file(source: Path) -> tuple[list[dict], list[dict]]:
    text = source.read_text(encoding="utf-8")
    blocks = split_blocks(text)

    accepted: list[dict] = []
    rejected: list[dict] = []

    for title, body in blocks:
        entry, reason = parse_entry(title, body)
        if entry:
            accepted.append(entry)
        else:
            rejected.append({"source": source.name, "title": title, "reason": reason or "Unknown parse failure"})

    return accepted, rejected


def entry_key(entry: dict) -> str:
    key_raw = "\n".join(
        [
            clean_text(str(entry.get("title", ""))).lower(),
            clean_text(str(entry.get("description", ""))).lower(),
            json.dumps(entry.get("part1_output", {}), ensure_ascii=False, sort_keys=True),
            clean_text(str(entry.get("part2_output", ""))).lower(),
        ]
    )
    return hashlib.sha256(key_raw.encode("utf-8")).hexdigest()


def dedupe_entries(entries: list[tuple[dict, str]]) -> tuple[list[dict], dict[str, int]]:
    seen: set[str] = set()
    out: list[dict] = []
    dup = {"truth": 0, "supplemental": 0}

    for entry, origin in entries:
        k = entry_key(entry)
        if k in seen:
            if origin in dup:
                dup[origin] += 1
            continue
        seen.add(k)
        out.append(entry)

    return out, dup


def write_outputs(entries: list[dict], output_dir: Path, report: dict) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    combined_path = output_dir / "combined.json"
    model1_path = output_dir / "model1_description_to_part1.jsonl"
    model2_path = output_dir / "model2_part1_to_backlog.jsonl"
    report_path = output_dir / "conversion_report.json"

    combined_payload = [
        {
            "title": e["title"],
            "description": e["description"],
            "part1_output": e["part1_output"],
            "part1_text": e["part1_text"],
            "part2_output": e["part2_output"],
        }
        for e in entries
    ]

    combined_path.write_text(json.dumps(combined_payload, indent=2, ensure_ascii=False), encoding="utf-8")

    with model1_path.open("w", encoding="utf-8") as f:
        for e in entries:
            f.write(
                json.dumps(
                    {
                        "prompt": e["description"],
                        "response": e["part1_text"],
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    with model2_path.open("w", encoding="utf-8") as f:
        for e in entries:
            f.write(
                json.dumps(
                    {
                        "prompt": e["part1_text"],
                        "response": e["part2_output"],
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def build_dataset(source_truth: Path, source_supplemental: Path, output_dir: Path) -> int:
    if not source_truth.exists():
        print(f"Source not found: {source_truth}")
        return 1
    if not source_supplemental.exists():
        print(f"Source not found: {source_supplemental}")
        return 1

    accepted_truth, rejected_truth = parse_source_file(source_truth)
    accepted_supp, rejected_supp = parse_source_file(source_supplemental)

    merged_candidates: list[tuple[dict, str]] = []
    merged_candidates.extend((e, "truth") for e in accepted_truth)
    merged_candidates.extend((e, "supplemental") for e in accepted_supp)

    deduped, dup_counts = dedupe_entries(merged_candidates)

    report = {
        "sources": [
            {
                "source": str(source_truth),
                "accepted_entries": len(accepted_truth),
                "rejected_entries": len(rejected_truth),
            },
            {
                "source": str(source_supplemental),
                "accepted_entries": len(accepted_supp),
                "rejected_entries": len(rejected_supp),
            },
        ],
        "duplicates_removed": {
            "truth": dup_counts["truth"],
            "supplemental": dup_counts["supplemental"],
            "total": dup_counts["truth"] + dup_counts["supplemental"],
        },
        "final_entries": len(deduped),
        "status_ignored": True,
        "model1_contract": {
            "prompt": "Proposal / Input",
            "response": "Title + Summary + Roles + Features + Goals + Timeline (plain text)",
            "excluded_sections": ["Status", "Proposal / Input", "Backlog"],
        },
        "model2_contract": {
            "prompt": "Model 1 response text",
            "response": "Backlog (Goal -> User Story -> exactly 2 Tasks)",
            "excluded_sections": ["Status"],
        },
        "rejected": rejected_truth + rejected_supp,
        "titles": [e["title"] for e in deduped],
    }

    write_outputs(deduped, output_dir, report)

    print(f"Truth source accepted: {len(accepted_truth)}")
    print(f"Supplemental source accepted: {len(accepted_supp)}")
    print(f"Rejected entries: {len(rejected_truth) + len(rejected_supp)}")
    print(f"Duplicates removed: {dup_counts['truth'] + dup_counts['supplemental']}")
    print(f"Final entries: {len(deduped)}")
    print(f"Wrote: {output_dir / 'combined.json'}")
    print(f"Wrote: {output_dir / 'model1_description_to_part1.jsonl'}")
    print(f"Wrote: {output_dir / 'model2_part1_to_backlog.jsonl'}")
    print(f"Wrote: {output_dir / 'conversion_report.json'}")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Build text-first dataset splits for Model 1 and Model 2")
    parser.add_argument("--source-truth", type=str, default=str(DEFAULT_SOURCE_TRUTH), help="Source-of-truth file")
    parser.add_argument("--source-supplemental", type=str, default=str(DEFAULT_SOURCE_SUPPLEMENTAL), help="Supplemental source file")
    parser.add_argument("--output-dir", type=str, default=str(DATASET_DIR), help="Dataset output directory")
    args = parser.parse_args()

    return build_dataset(Path(args.source_truth), Path(args.source_supplemental), Path(args.output_dir))


if __name__ == "__main__":
    raise SystemExit(main())
