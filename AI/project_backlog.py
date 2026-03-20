"""
CLI for Model 2 backlog generation. Reads Model 1 overview text (part1), outputs backlog text.

Input: Model 1 overview text file containing Title, Summary, Roles, Features, Goals, Timeline.
Not raw proposal. Strategy B only by default; retry gated by --enable-retry or BACKLOG_ENABLE_RETRY.

Uses notebook_step_inference.generate_backlog_from_part1. Prompt shape defaults to minimal_strict
(see BACKLOG_PROMPT_MODE in AI/README.md); set BACKLOG_PROMPT_MODE=legacy for the old guided prefix.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Ensure AI/ is on path when run from repo root (python AI/project_backlog.py)
_script_dir = Path(__file__).resolve().parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

# Load .env from AI/ and project root (before importing inference, which reads env)
try:
    from dotenv import load_dotenv
    load_dotenv(_script_dir / ".env")
    load_dotenv(_script_dir.parent / ".env")
except ImportError:
    pass


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate backlog (Model 2) from Model 1 overview text. Strategy B by default."
    )
    parser.add_argument(
        "--part1",
        required=True,
        help="Path to Model 1 overview text file (Title/Summary/Roles/Features/Goals/Timeline)",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Path to write backlog text. Default: stdout",
    )
    parser.add_argument(
        "--json-out",
        help="Path to write parsed JSON (epics dict). Implies parsing after generation.",
    )
    parser.add_argument(
        "--enable-retry",
        action="store_true",
        help="Enable retry when B output fails structure validation",
    )
    args = parser.parse_args()

    if args.enable_retry:
        os.environ["BACKLOG_ENABLE_RETRY"] = "1"

    p = Path(args.part1)
    if not p.exists():
        print(f"Error: part1 file not found: {p}", file=sys.stderr)
        return 1
    part1_text = p.read_text(encoding="utf-8", errors="replace")

    import notebook_step_inference
    import generated_parsers

    backlog_text = notebook_step_inference.generate_backlog_from_part1(part1_text)

    if args.output:
        Path(args.output).write_text(backlog_text, encoding="utf-8")
    else:
        print(backlog_text)

    if args.json_out:
        parsed = generated_parsers.parse_backlog_text(backlog_text)
        Path(args.json_out).write_text(
            json.dumps(parsed, indent=2), encoding="utf-8"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
