"""Build an augmented Model 1 dataset with dual prompt styles.

For each example in model1_description_to_part1.jsonl:
1) Keep original prompt (raw proposal)
2) Add concise instruction-wrapped prompt

This helps the model learn both direct continuation and instruction-following.
"""

from __future__ import annotations

import json
from pathlib import Path

DATASET_DIR = Path(__file__).resolve().parent
SOURCE = DATASET_DIR / "model1_description_to_part1.jsonl"
TARGET = DATASET_DIR / "model1_description_to_part1_dualprompt.jsonl"

INSTRUCTION_PREFIX = (
    "Generate ONLY the following sections in order: "
    "Title, Summary, Roles, Features, Goals, Timeline (Week 1-4).\n"
    "Do not include Status, Proposal/Input, or Backlog.\n\n"
    "Proposal / Input:\n"
)


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
        response = row["response"].strip()

        # Variant A: raw prompt
        out_rows.append({"prompt": prompt, "response": response})

        # Variant B: concise instruction prompt
        guided_prompt = f"{INSTRUCTION_PREFIX}{prompt}"
        out_rows.append({"prompt": guided_prompt, "response": response})

    with open(TARGET, "w", encoding="utf-8") as f:
        for row in out_rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    print(f"Source rows: {len(rows)}")
    print(f"Output rows: {len(out_rows)}")
    print(f"Wrote: {TARGET}")


if __name__ == "__main__":
    main()
