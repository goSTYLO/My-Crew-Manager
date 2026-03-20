"""
AI microservice integration test. Runs all overviews for hardcoded proposals, then all backlogs,
or batch backlog-only from JSONL.

Default: TEST_PROPOSALS — Phase 1 loads Model 1 once and writes all test_output_overview_{n};
Phase 2 loads Model 2 once and writes all test_output_backlog_{n} (two weight-load cycles total).

JSONL mode: load Part 1 prompts from model2 flat JSONL by index (skip Model 1).

Examples:
  python test_microservice.py
  python test_microservice.py --list-jsonl
  python test_microservice.py --jsonl-indices 0,8,9
  python test_microservice.py --jsonl-start 0 --jsonl-count 5
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path

# Ensure AI/ is on path when run from repo root
_script_dir = Path(__file__).resolve().parent
if str(_script_dir) not in sys.path:
    sys.path.insert(0, str(_script_dir))

# Load .env from AI/ and project root
try:
    from dotenv import load_dotenv

    load_dotenv(_script_dir / ".env")
    load_dotenv(_script_dir.parent / ".env")
except ImportError:
    pass

DEFAULT_JSONL = (
    _script_dir
    / "llms"
    / "fine_tune"
    / "dataset"
    / "model2_part1_to_backlog_epic_v1_flat.jsonl"
)

# Edit this list for local smoke / regression runs (order = run order).
TEST_PROPOSALS: list[str] = [
    """EventEasePro is an intelligent event planning solution that simplifies the organization of weddings, conferences, and other large gatherings. It leverages AI-driven recommendations to suggest venues and vendors, helping organizers make informed decisions quickly. The platform also includes scheduling tools and automated notifications, ensuring that tasks and deadlines are managed effectively. By reducing planning overhead, EventEase allows busy teams to focus on delivering memorable experiences rather than being overwhelmed by logistics. Its purpose is to streamline event management and minimize stress for organizers and participants alike.
"""
]


def log(msg: str) -> None:
    print(f"[TEST] {msg}")


def _output_paths(suffix_num: int) -> tuple[Path, Path, Path, Path]:
    """Numbered outputs: test_output_overview_{n}, test_output_backlog_{n}."""
    s = f"_{suffix_num}"
    return (
        _script_dir / f"test_output_overview{s}.txt",
        _script_dir / f"test_output_overview{s}.json",
        _script_dir / f"test_output_backlog{s}.txt",
        _script_dir / f"test_output_backlog{s}.json",
    )


def _load_jsonl_rows(path: Path) -> list[dict]:
    rows = []
    raw = path.read_text(encoding="utf-8")
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        rows.append(json.loads(line))
    return rows


def _parse_indices_arg(s: str | None) -> list[int] | None:
    if not s:
        return None
    out: list[int] = []
    for part in s.split(","):
        part = part.strip()
        if not part:
            continue
        out.append(int(part, 10))
    return out


def _jsonl_title_snippet(prompt: str, limit: int = 72) -> str:
    first = (prompt or "").strip().splitlines()[:1]
    t = first[0] if first else ""
    if len(t) > limit:
        return t[: limit - 3] + "..."
    return t


def list_jsonl_dataset(path: Path) -> None:
    rows = _load_jsonl_rows(path)
    print(f"[LIST] {path} ({len(rows)} rows)")
    for i, row in enumerate(rows):
        p = row.get("prompt", "")
        print(f"  [{i:3d}] {_jsonl_title_snippet(p)}")


def run_backlog_only_from_jsonl_index(
    path: Path,
    index: int,
    *,
    print_gold: bool,
) -> int:
    import generated_parsers
    import notebook_step_inference

    rows = _load_jsonl_rows(path)
    if index < 0 or index >= len(rows):
        log(f"jsonl index {index} out of range (0..{len(rows) - 1})")
        return 1
    row = rows[index]
    prompt = row.get("prompt") or ""
    overview_dict = generated_parsers.parse_training_part1_to_overview(prompt)
    goal_n = len(overview_dict.get("goals") or [])
    log(f"JSONL[{index}] goals={goal_n} title={overview_dict.get('title')!r}")

    otxt, ojs, btxt, bjs = _output_paths(index)

    # Save derived overview (from JSONL Part 1) for inspection
    training_roundtrip = generated_parsers.overview_dict_to_model2_training_prompt(overview_dict)
    otxt.write_text(training_roundtrip, encoding="utf-8")
    ojs.write_text(json.dumps(overview_dict, indent=2), encoding="utf-8")
    log(f"Wrote {otxt.name} / {ojs.name} (from JSONL prompt)")

    backlog_text = notebook_step_inference.generate_backlog_from_part1(overview_dict)
    log(f"Backlog generated ({len(backlog_text)} chars)")

    parsed_backlog = generated_parsers.parse_backlog_text(backlog_text)
    epic_n = len(parsed_backlog.get("epics") or [])
    log(f"Parsed epics={epic_n} (expected {goal_n})")

    btxt.write_text(backlog_text, encoding="utf-8")
    bjs.write_text(json.dumps(parsed_backlog, indent=2), encoding="utf-8")
    log(f"Saved {btxt.name} / {bjs.name}")
    log("--- Raw backlog output ---")
    print(backlog_text)
    log("--- End backlog ---")

    if print_gold and row.get("response"):
        log("--- Gold response (dataset) ---")
        print(row["response"])
        log("--- End gold ---")

    if epic_n != goal_n:
        log(f"WARN: epic count mismatch (got {epic_n}, goals={goal_n})")
    return 0


def run_default_proposal_flow() -> int:
    import generated_parsers
    import notebook_step_inference

    proposals = TEST_PROPOSALS
    n = len(proposals)
    if not n:
        log("TEST_PROPOSALS is empty; add at least one proposal string.")
        return 1

    log(
        f"Starting batch: {n} proposal(s) — phase 1 all overviews (Model 1 once), "
        f"phase 2 all backlogs (Model 2 once); outputs _1 … _{n}"
    )
    rc = 0
    parsed_by_idx: dict[int, dict[str, Any]] = {}

    try:
        # --- Phase 1: all overviews (overview model stays loaded) ---
        log("======== Phase 1: generate all overviews =========")
        for idx, proposal in enumerate(proposals, start=1):
            otxt, ojs, _, _ = _output_paths(idx)
            log(f"--- Overview {idx}/{n} ---")
            log(f"Proposal preview: {proposal[:120]}{'…' if len(proposal) > 120 else ''}")
            try:
                overview_text = notebook_step_inference.generate_overview_proposal(proposal)
                log(f"Overview generated ({len(overview_text)} chars)")
                parsed_overview = generated_parsers.parse_overview_text(overview_text)
                otxt.write_text(overview_text, encoding="utf-8")
                ojs.write_text(json.dumps(parsed_overview, indent=2), encoding="utf-8")
                parsed_by_idx[idx] = parsed_overview
                log(f"Saved {otxt.name} / {ojs.name}")
                log("--- Raw overview output ---")
                print(overview_text)
                log("--- End overview ---")
            except Exception as e:
                rc = 1
                log(f"Overview {idx} failed: {e}")
                log(traceback.format_exc())

        log("Unloading overview model to free VRAM for backlog model…")
        notebook_step_inference.unload_overview_model()
        log("Overview model unloaded.")

        # --- Phase 2: all backlogs (backlog model loaded once, first call loads it) ---
        log("======== Phase 2: generate all backlogs =========")
        for idx in range(1, n + 1):
            if idx not in parsed_by_idx:
                log(f"--- Backlog {idx}/{n} skipped (no overview) ---")
                continue
            _, _, btxt, bjs = _output_paths(idx)
            parsed_overview = parsed_by_idx[idx]
            log(f"--- Backlog {idx}/{n} ---")
            try:
                backlog_text = notebook_step_inference.generate_backlog_from_part1(parsed_overview)
                log(f"Backlog generated ({len(backlog_text)} chars)")
                parsed_backlog = generated_parsers.parse_backlog_text(backlog_text)
                btxt.write_text(backlog_text, encoding="utf-8")
                bjs.write_text(json.dumps(parsed_backlog, indent=2), encoding="utf-8")
                log(f"Saved {btxt.name} / {bjs.name}")
                log("--- Raw backlog output ---")
                print(backlog_text)
                log("--- End backlog ---")
            except Exception as e:
                rc = 1
                log(f"Backlog {idx} failed: {e}")
                log(traceback.format_exc())

        log(f"Batch complete. Files: test_output_overview_1…_{n}, test_output_backlog_1…_{n}")
        return rc

    except Exception as e:
        log(f"Error: {e}")
        log(traceback.format_exc())
        return 1

    finally:
        if "notebook_step_inference" in sys.modules:
            nsi = sys.modules["notebook_step_inference"]
            if hasattr(nsi, "unload_models"):
                log("Unloading models and freeing VRAM...")
                nsi.unload_models()
                log("VRAM freed.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Test overview+backlog inference (see module docstring).")
    parser.add_argument(
        "--jsonl-path",
        type=Path,
        default=DEFAULT_JSONL,
        help=f"Flat JSONL with prompt/response (default: {DEFAULT_JSONL.name})",
    )
    parser.add_argument("--list-jsonl", action="store_true", help="Print row indices and title line; exit.")
    parser.add_argument(
        "--jsonl-indices",
        type=str,
        default=None,
        help="Comma-separated 0-based row indices, e.g. 0,8,9. Runs backlog-only for each (no Model 1).",
    )
    parser.add_argument(
        "--jsonl-start",
        type=int,
        default=None,
        help="With --jsonl-count, run rows [start, start+count). Ignored if --jsonl-indices set.",
    )
    parser.add_argument(
        "--jsonl-count",
        type=int,
        default=None,
        help="Number of consecutive rows from --jsonl-start.",
    )
    parser.add_argument(
        "--show-gold",
        action="store_true",
        help="After each JSONL backlog run, print the dataset `response` line.",
    )
    args = parser.parse_args()

    if args.list_jsonl:
        path = args.jsonl_path.resolve()
        if not path.is_file():
            print(f"[ERR] Not found: {path}", file=sys.stderr)
            return 1
        list_jsonl_dataset(path)
        return 0

    indices = _parse_indices_arg(args.jsonl_indices)
    if indices is None and args.jsonl_start is not None:
        n = args.jsonl_count if args.jsonl_count is not None else 1
        indices = list(range(args.jsonl_start, args.jsonl_start + n))

    if indices:
        path = args.jsonl_path.resolve()
        if not path.is_file():
            print(f"[ERR] Not found: {path}", file=sys.stderr)
            return 1
        rc = 0
        try:
            import notebook_step_inference

            for i in indices:
                log(f"======== JSONL batch index {i} ========")
                sub = run_backlog_only_from_jsonl_index(
                    path, i, print_gold=args.show_gold
                )
                rc = rc or sub
                if i != indices[-1]:
                    log("Unloading backlog model between indices to mirror clean VRAM...")
                    notebook_step_inference.unload_models()
        except Exception as e:
            log(f"Error: {e}")
            log(traceback.format_exc())
            rc = 1
        finally:
            if "notebook_step_inference" in sys.modules:
                nsi = sys.modules["notebook_step_inference"]
                if hasattr(nsi, "unload_models"):
                    log("Unloading models and freeing VRAM...")
                    nsi.unload_models()
                    log("VRAM freed.")
        return rc

    return run_default_proposal_flow()


if __name__ == "__main__":
    sys.exit(main())
