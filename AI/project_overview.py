"""
CLI for Model 1 overview generation. Reads proposal, outputs overview text (and optionally JSON).
Strategy B only by default; C-fallback gated by --enable-c-fallback or OVERVIEW_ENABLE_C_FALLBACK.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Ensure AI/ is on path when run from repo root (python AI/project_overview.py)
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
        description="Generate project overview (Model 1) from a proposal. Strategy B by default."
    )
    parser.add_argument(
        "--proposal",
        required=True,
        help="Path to proposal text file, or '-' for stdin",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Path to write overview text. Default: stdout",
    )
    parser.add_argument(
        "--json-out",
        help="Path to write parsed JSON (overview dict). Implies parsing after generation.",
    )
    parser.add_argument(
        "--enable-c-fallback",
        action="store_true",
        help="Enable conditional C-strategy fallback when B fails quality gate",
    )
    parser.add_argument(
        "--device",
        help="Device override (reserved; currently uses CUDA if available)",
    )
    args = parser.parse_args()

    if args.enable_c_fallback:
        os.environ["OVERVIEW_ENABLE_C_FALLBACK"] = "1"

    if args.proposal == "-":
        proposal_text = sys.stdin.read()
    else:
        p = Path(args.proposal)
        if not p.exists():
            print(f"Error: proposal file not found: {p}", file=sys.stderr)
            return 1
        proposal_text = p.read_text(encoding="utf-8", errors="replace")

    import notebook_step_inference
    import generated_parsers

    overview_text = notebook_step_inference.generate_overview_proposal(proposal_text)

    if args.output:
        Path(args.output).write_text(overview_text, encoding="utf-8")
    else:
        print(overview_text)

    if args.json_out:
        parsed = generated_parsers.parse_overview_text(overview_text)
        Path(args.json_out).write_text(
            json.dumps(parsed, indent=2), encoding="utf-8"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
