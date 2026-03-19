"""Convert markdown proposals into training datasets expected by build_synthetic.py.

Reads:
  AI/llms/fine_tune/dataset/MycrewManager Dataset.md

Writes:
  AI/llms/fine_tune/dataset/combined.json
  AI/llms/fine_tune/dataset/model1_description_to_part1.jsonl
  AI/llms/fine_tune/dataset/model2_part1_to_backlog.jsonl
  AI/llms/fine_tune/dataset/conversion_report.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATASET_DIR = ROOT / "dataset"
DEFAULT_SOURCE = DATASET_DIR / "MycrewManager Dataset.md"
DEFAULT_SOURCE_2 = DATASET_DIR / "MycrewManager Dataset 2.md"


ROLE_KEYWORDS = {
    "AI Engineer": ["ai", "model", "analysis", "recommendation", "symptom", "triage", "analytics"],
    "Backend Developer": ["backend", "api", "database", "records", "integration", "secure", "scheduling"],
    "Frontend Developer": ["ui", "dashboard", "frontend", "portal", "interface", "monitoring"],
    "Mobile Developer": ["mobile", "app", "wearable"],
    "IoT Engineer": ["iot", "device", "sensor", "appliance"],
    "Data Scientist": ["data", "report", "forecast", "optimization"],
    "Security Specialist": ["security", "compliance", "privacy", "encryption"],
    "QA Engineer": ["test", "quality", "validation"],
}


@dataclass
class EpicItem:
    epic: str
    sub_epic: str
    story: str
    tasks: list[str]


def clean_text(text: str) -> str:
    text = text.replace("\u2019", "'")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_csv_values(text: str) -> list[str]:
    values = [clean_text(v) for v in text.split(",")]
    return [v for v in values if v]


def split_goals(text: str) -> list[str]:
    text = text.strip()
    goals = re.split(r",\s*", text)
    cleaned = []
    for goal in goals:
        g = clean_text(goal)
        if g:
            cleaned.append(g.rstrip("."))
    return cleaned


def choose_role(epic_text: str, roles: list[str]) -> str:
    lt = epic_text.lower()
    role_candidates = [clean_text(r) for r in roles]

    for preferred, words in ROLE_KEYWORDS.items():
        if any(word in lt for word in words):
            for role in role_candidates:
                if preferred.lower() in role.lower():
                    return role

    for role in role_candidates:
        if "project manager" not in role.lower() and "content creator" not in role.lower() and "career coach" not in role.lower() and "education specialist" not in role.lower():
            return role
    return role_candidates[0] if role_candidates else "Backend Developer"


def parse_timeline_block(section: str) -> dict[str, list[str]]:
    timeline: dict[str, list[str]] = {}
    week_matches = re.findall(r"\*\s*Week\s*(\d+)\s*:\s*(.+)", section)
    for week_num, tasks_raw in week_matches:
        parts = re.split(r",\s*|\s+and\s+", tasks_raw)
        tasks = [clean_text(p).rstrip(".") for p in parts if clean_text(p)]
        timeline[f"week{week_num}"] = tasks

    for w in ["week1", "week2", "week3", "week4"]:
        timeline.setdefault(w, ["Refine implementation details"])
    return timeline


def ensure_story(story: str, role: str, epic: str) -> str:
    s = clean_text(story)
    if not s:
        return f"As a {role}, I need to implement {epic.lower()}"
    if s.lower().startswith("as a") or s.lower().startswith("as an"):
        return s
    return f"As a {role}, I need {s.lower()}"


def parse_epic_line(line: str) -> EpicItem | None:
    normalized = clean_text(line)
    m = re.match(
        r"\*\s*Epic:\s*(.+?)\s*->?\s*Sub-epic:\s*(.+?)\s*->?\s*User Story:\s*(.+?)\s*->?\s*Tasks:\s*(.+)",
        normalized,
        flags=re.IGNORECASE,
    )
    if not m:
        m = re.match(
            r"\*\s*Epic:\s*(.+?)\s*→\s*Sub-epic:\s*(.+?)\s*→\s*User Story:\s*(.+?)\s*→\s*Tasks:\s*(.+)",
            normalized,
            flags=re.IGNORECASE,
        )
        if not m:
            return None

    epic, sub_epic, story, tasks = m.groups()
    task_list = [clean_text(t).rstrip(".") for t in tasks.split(",") if clean_text(t)]
    if len(task_list) == 1:
        task_list.append(f"Validate and test {epic.lower()}")
    if len(task_list) > 2:
        task_list = task_list[:2]
    return EpicItem(
        epic=clean_text(epic),
        sub_epic=clean_text(sub_epic),
        story=clean_text(story),
        tasks=task_list,
    )


def normalize_title_as_epic(text: str) -> str:
    t = clean_text(text)
    t = re.sub(r"^(build|implement|create|develop|generate|integrate)\s+", "", t, flags=re.IGNORECASE)
    t = t.strip()
    if not t:
        return "Core Platform Capability"
    return t[0].upper() + t[1:]


def build_backlog_text(epics: list[EpicItem], goals: list[dict[str, str]]) -> str:
    lines: list[str] = []
    for i, epic in enumerate(epics, start=1):
        goal_cover = goals[i - 1]["epic"] if i - 1 < len(goals) else epic.epic
        lines.append(f"Epic {i}: {epic.epic} *(covers: {goal_cover})*")
        lines.append(f" -Sub-Epic {i}.1: {epic.sub_epic}")
        lines.append(f"  -User Story {i}.1.1: {epic.story}")
        lines.append(f"   -Task {i}.1.1.1: {epic.tasks[0]}")
        lines.append(f"   -Task {i}.1.1.2: {epic.tasks[1]}")
    return "\n".join(lines)


def parse_proposal(block: str) -> dict | None:
    title_match = re.search(r"##\s*\*\*(.+?)\*\*", block)
    if not title_match:
        return None

    desc_match = re.search(r"\*\*Description:\*\*\s*(.+?)\n\n\*\*Part 1 Output:\*\*", block, re.DOTALL)
    summary_match = re.search(r"\*\s*\*\*Summary:\*\*\s*(.+)", block)
    roles_match = re.search(r"\*\s*\*\*Roles:\*\*\s*(.+)", block)
    features_match = re.search(r"\*\s*\*\*Features:\*\*\s*(.+)", block)
    goals_match = re.search(r"\*\s*\*\*Goals \(Epics\):\*\*\s*(.+)", block)
    timeline_match = re.search(r"\*\s*\*\*Timeline:\*\*(.+?)\n\n\*\*Part 2 Output", block, re.DOTALL)
    part2_match = re.search(r"\*\*Part 2 Output \(Backlog\):\*\*(.+)$", block, re.DOTALL)

    if not all([desc_match, summary_match, roles_match, features_match, goals_match, timeline_match, part2_match]):
        return None

    description = clean_text(desc_match.group(1))
    summary = clean_text(summary_match.group(1)).rstrip(".") + "."
    roles = split_csv_values(roles_match.group(1))
    features = split_csv_values(features_match.group(1))
    goal_texts = split_goals(goals_match.group(1))

    goals = []
    for goal_text in goal_texts:
        epic_title = normalize_title_as_epic(goal_text)
        role = choose_role(epic_title, roles)
        goals.append({"epic": epic_title, "role": role})

    timeline = parse_timeline_block(timeline_match.group(1))

    epic_items: list[EpicItem] = []
    for line in part2_match.group(1).splitlines():
        if "Epic:" not in line:
            continue
        parsed = parse_epic_line(line)
        if parsed:
            epic_items.append(parsed)

    existing_names = {e.epic.lower() for e in epic_items}
    for goal in goals:
        if len(epic_items) >= 4:
            break
        g = goal["epic"]
        if g.lower() in existing_names:
            continue
        role = goal["role"]
        epic_items.append(
            EpicItem(
                epic=g,
                sub_epic=f"{g} Implementation",
                story=f"As a {role}, I need to implement {g.lower()}",
                tasks=[f"Implement {g.lower()}", f"Test and validate {g.lower()}"],
            )
        )
        existing_names.add(g.lower())

    for feature in features:
        if len(epic_items) >= 4:
            break
        if feature.lower() in existing_names:
            continue
        role = choose_role(feature, roles)
        epic_items.append(
            EpicItem(
                epic=feature,
                sub_epic=f"{feature} Module",
                story=f"As a {role}, I need to deliver {feature.lower()} capabilities",
                tasks=[f"Build {feature.lower()} core workflows", f"Complete QA for {feature.lower()}"],
            )
        )
        existing_names.add(feature.lower())

    while len(epic_items) < 4:
        i = len(epic_items) + 1
        epic_items.append(
            EpicItem(
                epic=f"Operational Readiness {i}",
                sub_epic="Quality and Deployment",
                story="As a project manager, I need a production-ready release",
                tasks=["Run end-to-end validation", "Prepare deployment checklist"],
            )
        )

    for item in epic_items:
        cover_role = choose_role(item.epic, roles)
        item.story = ensure_story(item.story, cover_role, item.epic)
        if len(item.tasks) < 2:
            item.tasks = (item.tasks + [f"Validate and test {item.epic.lower()}"])[:2]
        if len(item.tasks) > 2:
            item.tasks = item.tasks[:2]

    part1_output = {
        "summary": summary,
        "roles": roles,
        "features": features,
        "goals": goals,
        "timeline": timeline,
    }
    part2_output = build_backlog_text(epic_items[: max(4, len(epic_items))], goals)

    return {
        "title": clean_text(title_match.group(1)),
        "description": description,
        "part1_output": part1_output,
        "part2_output": part2_output,
    }


def parse_proposal_with_reason(block: str) -> tuple[dict | None, str | None]:
    """Parse one proposal block and return (proposal, rejection_reason)."""
    title_match = re.search(r"##\s*\*\*(.+?)\*\*", block)
    if not title_match:
        return None, "Missing title heading"

    if "**Description:**" not in block:
        return None, "Missing Description section"
    if "**Part 1 Output:**" not in block:
        return None, "Missing Part 1 Output section"
    if "**Part 2 Output (Backlog):**" not in block:
        return None, "Missing Part 2 Output (Backlog) section"

    proposal = parse_proposal(block)
    if proposal is None:
        return None, "Failed to parse proposal fields"

    if not validate_part1(proposal["part1_output"]):
        return None, "Part 1 schema validation failed"
    if not validate_backlog_format(proposal["part2_output"]):
        return None, "Backlog format validation failed"
    return proposal, None


def validate_part1(part1: dict) -> bool:
    if not isinstance(part1, dict):
        return False
    if not part1.get("summary") or not isinstance(part1["summary"], str):
        return False
    if not part1.get("roles") or not isinstance(part1["roles"], list):
        return False
    if not part1.get("features") or not isinstance(part1["features"], list):
        return False
    if not part1.get("goals") or not isinstance(part1["goals"], list):
        return False
    for g in part1["goals"]:
        if not isinstance(g, dict) or "epic" not in g or "role" not in g:
            return False
    if not part1.get("timeline") or not isinstance(part1["timeline"], dict):
        return False
    return True


def validate_backlog_format(response: str) -> bool:
    if not response or not isinstance(response, str):
        return False
    r = response.lower().strip()
    has_epic = "epic" in r and ":" in response
    has_task = "-task" in r or "task" in r
    lines = response.splitlines()
    epic_count = sum(1 for line in lines if line.strip().lower().startswith("epic") and ":" in line)
    task_count = sum(1 for line in lines if line.strip().lower().startswith("-task") and ":" in line)
    return has_epic and has_task and epic_count >= 4 and task_count > 0


def parse_markdown_dataset(text: str, source_name: str) -> tuple[list[dict], list[dict]]:
    blocks = [b.strip() for b in re.split(r"\n##\s*\*\*", "\n" + text) if b.strip()]
    proposals: list[dict] = []
    rejected: list[dict] = []

    for block in blocks:
        if block.startswith("## **"):
            normalized_block = block
        else:
            normalized_block = "## **" + block
        proposal, reason = parse_proposal_with_reason(normalized_block)
        if proposal:
            proposals.append(proposal)
        else:
            title_match = re.search(r"##\s*\*\*(.+?)\*\*", normalized_block)
            rejected.append(
                {
                    "source": source_name,
                    "title": clean_text(title_match.group(1)) if title_match else "(unknown)",
                    "reason": reason or "Rejected for unknown reason",
                }
            )
    return proposals, rejected


def _entry_key(entry: dict) -> str:
    """Stable key for deduplication across converted and existing entries."""
    desc = clean_text(str(entry.get("description", ""))).lower()
    part1 = json.dumps(entry.get("part1_output", {}), ensure_ascii=False, sort_keys=True)
    part2 = clean_text(str(entry.get("part2_output", ""))).lower()
    raw = f"{desc}\n{part1}\n{part2}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _normalize_entry(entry: dict, fallback_title: str = "") -> dict | None:
    """Normalize arbitrary entry object into converter's internal shape."""
    if not isinstance(entry, dict):
        return None
    description = entry.get("description")
    part1 = entry.get("part1_output")
    part2 = entry.get("part2_output")
    if not isinstance(description, str) or not isinstance(part1, dict) or not isinstance(part2, str):
        return None
    normalized = {
        "title": clean_text(str(entry.get("title", "") or fallback_title or "(untitled)")),
        "description": clean_text(description),
        "part1_output": part1,
        "part2_output": part2,
    }
    if not validate_part1(normalized["part1_output"]):
        return None
    if not validate_backlog_format(normalized["part2_output"]):
        return None
    return normalized


def load_existing_combined(path: Path) -> list[dict]:
    """Load existing combined entries if present and valid."""
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []

    entries: list[dict] = []
    for idx, item in enumerate(data, start=1):
        normalized = _normalize_entry(item, fallback_title=f"existing_{idx}")
        if normalized:
            entries.append(normalized)
    return entries


def write_outputs(entries: list[dict], output_dir: Path, report: dict) -> None:
    combined = [
        {
            "description": e["description"],
            "part1_output": e["part1_output"],
            "part2_output": e["part2_output"],
        }
        for e in entries
    ]

    combined_path = output_dir / "combined.json"
    model1_path = output_dir / "model1_description_to_part1.jsonl"
    model2_path = output_dir / "model2_part1_to_backlog.jsonl"
    report_path = output_dir / "conversion_report.json"

    combined_path.write_text(json.dumps(combined, indent=2, ensure_ascii=False), encoding="utf-8")

    with model1_path.open("w", encoding="utf-8") as f1:
        for item in combined:
            f1.write(
                json.dumps(
                    {
                        "prompt": item["description"],
                        "response": json.dumps(item["part1_output"], ensure_ascii=False),
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    with model2_path.open("w", encoding="utf-8") as f2:
        for item in combined:
            f2.write(
                json.dumps(
                    {
                        "prompt": json.dumps(item["part1_output"], ensure_ascii=False),
                        "response": item["part2_output"],
                    },
                    ensure_ascii=False,
                )
                + "\n"
            )

    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


def main(sources: list[Path], output_dir: Path, merge_existing: bool) -> int:
    source_reports: list[dict] = []
    all_new_entries: list[dict] = []
    all_rejected: list[dict] = []

    for source in sources:
        if not source.exists():
            print(f"Source not found: {source}")
            return 1
        text = source.read_text(encoding="utf-8")
        parsed, rejected = parse_markdown_dataset(text, source.name)
        all_new_entries.extend(parsed)
        all_rejected.extend(rejected)
        source_reports.append(
            {
                "source": str(source),
                "parsed_entries": len(parsed) + len(rejected),
                "accepted_entries": len(parsed),
                "rejected_entries": len(rejected),
            }
        )

    existing_entries = load_existing_combined(output_dir / "combined.json") if merge_existing else []
    candidates: list[tuple[dict, str]] = []
    candidates.extend((e, "existing") for e in existing_entries)
    candidates.extend((e, "new") for e in all_new_entries)

    deduped: list[dict] = []
    seen_keys: set[str] = set()
    duplicate_existing = 0
    duplicate_new = 0
    for entry, origin in candidates:
        key = _entry_key(entry)
        if key in seen_keys:
            if origin == "existing":
                duplicate_existing += 1
            else:
                duplicate_new += 1
            continue
        seen_keys.add(key)
        deduped.append(entry)

    final_entries = deduped
    output_dir.mkdir(parents=True, exist_ok=True)

    report = {
        "sources": source_reports,
        "existing_entries_loaded": len(existing_entries),
        "new_entries_accepted": len(all_new_entries),
        "new_entries_rejected": len(all_rejected),
        "duplicates_removed": {
            "existing": duplicate_existing,
            "new": duplicate_new,
            "total": duplicate_existing + duplicate_new,
        },
        "final_entries": len(final_entries),
        "valid_part1": sum(1 for e in final_entries if validate_part1(e["part1_output"])),
        "valid_backlog": sum(1 for e in final_entries if validate_backlog_format(e["part2_output"])),
        "titles": [e["title"] for e in final_entries],
        "rejected": all_rejected,
    }

    write_outputs(final_entries, output_dir, report)

    print(f"Sources processed: {len(sources)}")
    print(f"New accepted entries: {len(all_new_entries)}")
    print(f"New rejected entries: {len(all_rejected)}")
    print(f"Existing entries merged: {len(existing_entries)}")
    print(f"Duplicates removed: {duplicate_existing + duplicate_new}")
    print(f"Final entries: {len(final_entries)}")
    print(f"Wrote: {output_dir / 'combined.json'}")
    print(f"Wrote: {output_dir / 'model1_description_to_part1.jsonl'}")
    print(f"Wrote: {output_dir / 'model2_part1_to_backlog.jsonl'}")
    print(f"Wrote: {output_dir / 'conversion_report.json'}")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert markdown dataset to training JSON/JSONL format")
    parser.add_argument(
        "--source",
        action="append",
        default=None,
        help="Path to markdown source. Can be passed multiple times.",
    )
    parser.add_argument("--output-dir", type=str, default=str(DATASET_DIR), help="Output directory")
    parser.add_argument(
        "--no-merge-existing",
        action="store_true",
        help="Do not merge with existing combined.json before writing outputs.",
    )
    args = parser.parse_args()
    source_args = args.source if args.source else [str(DEFAULT_SOURCE), str(DEFAULT_SOURCE_2)]
    source_paths = [Path(s) for s in source_args]
    raise SystemExit(
        main(
            sources=source_paths,
            output_dir=Path(args.output_dir),
            merge_existing=not args.no_merge_existing,
        )
    )
