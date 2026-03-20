"""Build an augmented Model 1 dataset with corrected Goals (EPIC-level) and v2 enhancements.

For each example in model1_description_to_part1.jsonl:
1) Rewrite Goals to be EPIC-level (high-level objectives, not task lists)
2) Remove Status completely
3) Create dual-prompt augmented dataset (52 rows from 26 base)

This ensures Goals are distinct from Features and match the project structure contract.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent
SOURCE = DATASET_DIR / "model1_description_to_part1.jsonl"
TARGET = DATASET_DIR / "model1_description_to_part1_dualprompt_v2.jsonl"

INSTRUCTION_PREFIX = (
    "Generate ONLY the following sections in order: "
    "Title, Summary, Roles, Features, Goals, Timeline (Week 1-4).\n"
    "Do not include Status, Proposal/Input, or Backlog.\n\n"
    "Proposal / Input:\n"
)


def extract_features(response: str) -> list[str]:
    """Extract Features list from response."""
    match = re.search(r"^Features:\n(.*?)(?=\n\n|^[A-Z]|\Z)", response, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    if match:
        features_text = match.group(1).strip()
        features = [line.strip().lstrip("- ") for line in features_text.split("\n") if line.strip().startswith("-")]
        return [f for f in features if f]
    return []


def generate_epic_goals(features: list[str]) -> list[str]:
    """Generate EPIC-level goals from Features list."""
    if not features:
        return ["Complete core feature implementation", "Ensure platform stability and performance", "Deploy MVP to production"]
    
    # Group features into EPIC-level objectives
    epics = []
    
    # Common patterns for epics
    feature_str = " ".join(features).lower()
    
    # Authentication/User Management
    if any(word in feature_str for word in ["auth", "login", "register", "user"]):
        epics.append("Establish secure user authentication and access control")
    
    # Core functionality
    if any(word in feature_str for word in ["track", "manage", "monitor", "create"]):
        epics.append("Enable core feature implementation and user interaction")
    
    # AI/Intelligence
    if any(word in feature_str for word in ["ai", "recommend", "predict", "smart"]):
        epics.append("Integrate AI-driven insights and recommendations")
    
    # Real-time/Updates
    if any(word in feature_str for word in ["real-time", "update", "dashboard", "notification"]):
        epics.append("Enable real-time updates and live notifications")
    
    # Data/Integration
    if any(word in feature_str for word in ["integrat", "api", "data", "record"]):
        epics.append("Integrate external systems and data sources")
    
    # Quality/Deployment
    epics.append("Ensure platform stability, performance, and reliable deployment")
    
    # If no features matched, return defaults
    if not epics:
        epics = [
            "Complete core feature implementation",
            "Ensure platform stability and performance",
            "Deploy MVP to production"
        ]
    
    return epics


def rewrite_response_with_better_goals(response: str) -> str:
    """Rewrite response with EPIC-level goals and remove Status."""
    # Extract title
    title_match = re.search(r"^===\s*(.+?)\s*===|^Title:\s*(.+)$", response, re.MULTILINE)
    title = title_match.group(1).strip() if title_match and title_match.group(1) else (title_match.group(2).strip() if title_match else "Untitled")
    
    # Extract sections
    summary_match = re.search(r"^Summary:\n(.*?)(?=\n\n[A-Z]|\Z)", response, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    summary = summary_match.group(1).strip() if summary_match else ""
    
    roles_match = re.search(r"^Roles:\n(.*?)(?=\n\n[A-Z]|\Z)", response, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    roles = roles_match.group(1).strip() if roles_match else ""
    
    features = extract_features(response)
    
    timeline_match = re.search(r"^Timeline:\n(.*?)(?:\n\n[A-Z]|\Z)", response, re.MULTILINE | re.IGNORECASE | re.DOTALL)
    timeline = timeline_match.group(1).strip() if timeline_match else ""
    
    # Generate new EPIC-level goals
    epic_goals = generate_epic_goals(features)
    goals_text = "\n".join([f"- {goal}" for goal in epic_goals])
    
    # Reconstruct response (NO Status field)
    new_response = f"Title: {title}\n\n"
    if summary:
        new_response += f"Summary:\n{summary}\n\n"
    if roles:
        new_response += f"Roles:\n{roles}\n\n"
    
    new_response += "Features:\n"
    new_response += "\n".join([f"- {feature}" for feature in features]) + "\n\n"
    
    new_response += f"Goals:\n{goals_text}\n\n"
    
    if timeline:
        new_response += f"Timeline:\n{timeline}"
    
    return new_response.strip()


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source dataset: {SOURCE}")

    rows = []
    for line in SOURCE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))

    out_rows = []
    for row in rows:
        prompt = row["prompt"].strip()
        original_response = row["response"].strip()
        
        # Rewrite response with better goals
        improved_response = rewrite_response_with_better_goals(original_response)
        
        # Variant A: raw prompt with improved response
        out_rows.append({"prompt": prompt, "response": improved_response})

        # Variant B: concise instruction prompt with improved response
        guided_prompt = f"{INSTRUCTION_PREFIX}{prompt}"
        out_rows.append({"prompt": guided_prompt, "response": improved_response})

    with open(TARGET, "w", encoding="utf-8") as f:
        for row in out_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Source rows: {len(rows)}")
    print(f"Output rows: {len(out_rows)}")
    print(f"Wrote: {TARGET}")


if __name__ == "__main__":
    main()
