"""Separate and clean combined_dataset_model1_and_2.txt into Model 1/2 v3 datasets.

Model 1:
- Prompt: Proposal / Input
- Response: Title + Summary + Roles + Features + Goals + Timeline
- Output file is dual-prompt augmented (raw + guided prompt variants)

Model 2:
- Prompt: Part 1 sections (Title, Summary, Roles, Features, Goals, Timeline)
- Response: Backlog only

Status is excluded from all outputs.
"""

import json
import re
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent
SOURCE = DATASET_DIR / "combined_dataset_model1_and_2.txt"
MODEL1_OUTPUT = DATASET_DIR / "model1_description_to_part1_dualprompt_v3.jsonl"
MODEL2_OUTPUT = DATASET_DIR / "model2_part1_to_backlog_v3.jsonl"

INSTRUCTION_PREFIX = (
    "Generate ONLY the following sections in order: "
    "Title, Summary, Roles, Features, Goals, Timeline (Week 1-4).\n"
    "Do not include Status, Proposal/Input, or Backlog.\n\n"
    "Proposal / Input:\n"
)

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


def _clean_title(raw_title: str) -> str:
    title = raw_title.strip()
    title = re.sub(r"^=+\s*", "", title)
    title = re.sub(r"\s*=+$", "", title)
    return title.strip()


def _parse_sections(body: str) -> dict[str, str]:
    section_data: dict[str, list[str]] = {h: [] for h in SECTION_HEADERS}
    current: str | None = None

    for line in body.splitlines():
        stripped = line.strip()
        maybe_header = stripped[:-1] if stripped.endswith(":") else None
        if maybe_header in section_data:
            current = maybe_header
            continue

        if current is not None:
            section_data[current].append(line.rstrip())

    return {k: "\n".join(v).strip() for k, v in section_data.items()}


def parse_records(text: str) -> list[dict]:
    """Parse each titled block between heading and delimiter line `===`."""
    records = []
    pattern = re.compile(r"(?ms)^===\s*(?P<title>.+?)\s*===\s*\n(?P<body>.*?)(?=^===\s*$|\Z)")

    for match in pattern.finditer(text):
        title = _clean_title(match.group("title"))
        body = match.group("body").strip()
        sections = _parse_sections(body)

        record = {
            "title": title,
            "proposal": sections.get("Proposal / Input", ""),
            "summary": sections.get("Summary", ""),
            "roles": sections.get("Roles", ""),
            "features": sections.get("Features", ""),
            "goals": sections.get("Goals", ""),
            "timeline": sections.get("Timeline", ""),
            "backlog": sections.get("Backlog", ""),
        }

        # Require all key Model 1 inputs/targets except backlog.
        required = ["proposal", "summary", "roles", "features", "goals", "timeline"]
        if any(not record[k] for k in required):
            continue

        records.append(record)

    return records


def build_model1_response(record: dict) -> str:
    """Build Model 1 response: Summary + Roles + Features + Goals + Timeline (NO Status, NO Backlog)."""
    parts = []
    
    parts.append(f"Title: {record['title']}")
    
    if record['summary']:
        parts.append(f"\nSummary:\n{record['summary']}")
    
    if record['roles']:
        parts.append(f"\nRoles:\n{record['roles']}")
    
    if record['features']:
        parts.append(f"\nFeatures:\n{record['features']}")
    
    if record['goals']:
        parts.append(f"\nGoals:\n{record['goals']}")
    
    if record['timeline']:
        parts.append(f"\nTimeline:\n{record['timeline']}")
    
    return "".join(parts).strip()


def build_model2_prompt(record: dict) -> str:
    """Build Model 2 prompt with Part 1 sections only."""
    return (
        f"=== {record['title']} ===\n"
        f"Summary:\n{record['summary']}\n\n"
        f"Roles:\n{record['roles']}\n\n"
        f"Features:\n{record['features']}\n\n"
        f"Goals:\n{record['goals']}\n\n"
        f"Timeline:\n{record['timeline']}"
    ).strip()


def build_model2_input(record: dict) -> str:
    """Build Model 2 input: Summary + Roles + Features + Goals + Timeline."""
    return build_model2_prompt(record)


def build_model2_output(record: dict) -> str:
    """Build Model 2 output: Backlog."""
    return f"Backlog:\n{record['backlog']}" if record['backlog'] else ""


def main():
    print("=" * 80)
    print("PARSING AND SEPARATING COMBINED DATASET")
    print("=" * 80)
    
    # Read combined file
    if not SOURCE.exists():
        raise FileNotFoundError(f"Source file not found: {SOURCE}")
    
    text = SOURCE.read_text(encoding="utf-8")
    print(f"Loaded combined file: {SOURCE.name}")
    print(f"File size: {len(text):,} bytes")
    
    # Parse records
    records = parse_records(text)
    print(f"Parsed records: {len(records)}")
    
    # Build Model 1 dataset (Proposal → full Part 1 response), dual-prompt augmented.
    model1_rows = []
    for record in records:
        response = build_model1_response(record)
        base_prompt = record["proposal"]
        guided_prompt = INSTRUCTION_PREFIX + base_prompt

        model1_rows.append({"prompt": base_prompt, "response": response})
        model1_rows.append({"prompt": guided_prompt, "response": response})
    
    # Build Model 2 dataset (Part 1 sections → Backlog)
    model2_rows = []
    for record in records:
        if record["backlog"]:  # Only include if backlog exists
            model2_rows.append({
                "prompt": build_model2_input(record),
                "response": build_model2_output(record),
            })
    
    # Save Model 1 dataset
    with open(MODEL1_OUTPUT, "w", encoding="utf-8") as f:
        for row in model1_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"\n✓ Model 1 dataset saved: {MODEL1_OUTPUT.name}")
    print(f"  Examples: {len(model1_rows)}")
    
    # Save Model 2 dataset
    with open(MODEL2_OUTPUT, "w", encoding="utf-8") as f:
        for row in model2_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(f"✓ Model 2 dataset saved: {MODEL2_OUTPUT.name}")
    print(f"  Examples: {len(model2_rows)}")

    # Quick audit to verify section completeness in Model 1 responses.
    missing_counts = {"Roles": 0, "Features": 0, "Goals": 0, "Timeline": 0}
    for row in model1_rows:
        response = row["response"]
        for sec in missing_counts:
            if f"\n{sec}:\n" not in f"\n{response}\n":
                missing_counts[sec] += 1

    print("\nModel 1 section audit (missing counts):")
    for sec, cnt in missing_counts.items():
        print(f"- {sec}: {cnt}")
    
    print("\n" + "=" * 80)
    print("SEPARATION COMPLETE")
    print("=" * 80)
    print("\nDatasets cleaned and separated successfully!")
    print("Next steps:")
    print("1. Update Step 2 to use dualprompt_v3 files")
    print("2. Re-run training (Steps 2-5) for Model 1")
    print("3. Verify outputs with Step 6 inference test")


if __name__ == "__main__":
    main()
