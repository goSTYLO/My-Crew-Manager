import gc
import json
import os
import re
from datetime import datetime

from backlog_minimal_strict_prompt import (
    minimal_strict_guide as _minimal_strict_guide,
    minimal_strict_retry_suffix,
)

# Final VRAM cleanup before loading inference models.
for _name in ("eval_trainer", "winner_model", "eval_base", "model", "trainer"):
    if _name in globals():
        del globals()[_name]
if torch.cuda.is_available():
    torch.cuda.empty_cache()
gc.collect()

adapter_rel = os.getenv("PEFT_ADAPTER_PATH_BACKLOG", "llms/fine_tune/qwen_model2_backlog_lora_1p5b")
adapter_path_obj = Path(adapter_rel)
if adapter_path_obj.is_absolute():
    PROMOTED_ADAPTER_DIR = adapter_path_obj
else:
    PROMOTED_ADAPTER_DIR = (_ai_root / adapter_path_obj).resolve()

if not PROMOTED_ADAPTER_DIR.exists():
    raise FileNotFoundError(f"Promoted adapter not found: {PROMOTED_ADAPTER_DIR}")

base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    dtype=torch.float16,
    trust_remote_code=True,
)
model_infer = PeftModel.from_pretrained(base_model, str(PROMOTED_ADAPTER_DIR))
if torch.cuda.is_available():
    model_infer = model_infer.to("cuda")

model_infer.eval()
for param in model_infer.parameters():
    param.requires_grad = False

if "DATASET_FILENAME" not in globals():
    DATASET_FILENAME = "model2_part1_to_backlog_epic_v1_flat.jsonl"
dataset_file = DATASET_DIR / DATASET_FILENAME
if not dataset_file.exists():
    raise FileNotFoundError(f"Missing dataset for inference tests: {dataset_file}")

# Optional marker for UI / post-processing only; training labels do NOT include this.
OUTPUT_END_MARKER = "END_OF_BACKLOG"

# --- Training alignment (see llms/fine_tune/prepare_dataset.py: full_text = prompt + "\n" + response)
# PROMPT_MODE controls what comes after the Part 1 prompt (+ newline):
#   minimal_strict — short rules + epic count (default; small train/infer gap, reduces base-model drift)
#   training_exact — nothing extra (strict JSONL boundary; can drift without guidance)
#   legacy — long COMPACT_STRICT_PROMPT + Input/Backlog wrapper
_PROMPT_MODE_ALLOWED = frozenset({"minimal_strict", "training_exact", "legacy"})
PROMPT_MODE = "minimal_strict"
_mnorm = PROMPT_MODE.strip().lower()
if _mnorm not in _PROMPT_MODE_ALLOWED:
    raise ValueError(
        f"PROMPT_MODE must be one of {sorted(_PROMPT_MODE_ALLOWED)}; got {PROMPT_MODE!r}"
    )
PROMPT_MODE = _mnorm

# Legacy long prompt (only used when PROMPT_MODE == "legacy").
COMPACT_STRICT_PROMPT = (
    "You are a flat backlog generator. Output ONLY a structured backlog hierarchy.\n\n"
    "HARD RULES:\n"
    "1. Epic count must equal Goals count exactly.\n"
    "2. Epics numbered 1, 2, 3... sequentially with no gaps or decimals.\n"
    "3. Per Epic: exactly 1 Sub-Epic, 1 User Story, 2 Tasks (no more, no less).\n"
    "4. Format: Epic N: title, -Sub-Epic N: title, -User Story N: As a..., -Task 1: action, -Task 2: action\n"
    "5. Each element on its own line.\n\n"
    "FORBIDDEN OUTPUT PATTERNS (DO NOT USE):\n"
    "- Markdown tables (no |---|---|---| format)\n"
    "- Bullet lists (no *, -, or numbers like 1., 2.)\n"
    "- Prose paragraphs or narrative text\n"
    "- Sectioned headers (Status:, Summary:, Roles:, Features:, Timeline:, etc.)\n"
    "- Decimal numbering (1.1, 1.1.1, 1.1.1.1)\n"
    "- Any output after END_OF_BACKLOG\n\n"
    "REQUIRED CONTENT:\n"
    "- Use Goals as Epic titles in exact order.\n"
    "- User stories: As a <role>, I want <capability> so that <benefit>.\n"
    "- Tasks: concrete implementation actions with deliverables (not 'implement X' or 'design Y').\n\n"
    "EXAMPLE (5 goals → 5 epics):\n"
    "Epic 1: Goal 1 title\n"
    "-Sub-Epic 1: delivery phase\n"
    "-User Story 1: As a user, I want feature so that outcome.\n"
    "-Task 1: Build API endpoint for authentication\n"
    "-Task 2: Create dashboard UI for user login\n"
    "Epic 2: Goal 2 title\n"
    "-Sub-Epic 1: delivery phase\n"
    "-User Story 1: As a user, I want feature so that outcome.\n"
    "-Task 1: specific implementation action\n"
    "-Task 2: specific implementation action\n\n"
    f"After the final Task 2 of the last Epic, output {OUTPUT_END_MARKER} and stop. No other text.\n\n"
)

# Scoring: do not require END markers (dataset has none).
REQUIRE_END_MARKER_FOR_PASS = False

# Minimal bad-token nudges; avoid blocking Summary/Roles in input (bad_words only affects generation).
# Each entry becomes a banned token *sequence* (HF accepts multi-token sequences). Avoid over-expanding:
# banning "-" or single chars can suppress valid "-Sub-Epic" / "-Task" lines.
USE_BAD_WORDS = True
_BAD_PHRASES = [
    "Instruction:",
    "Solution:",
    "```",
    "###",  # discourage markdown headings; safe to drop if it causes empty generations
]
_BAD_IDS = [tokenizer(x, add_special_tokens=False).input_ids for x in _BAD_PHRASES]
_BAD_IDS = [x for x in _BAD_IDS if x]

# Inference controls.
QUICK_RUN_MODE = True
STRATEGIES_TO_RUN = ["B", "C"]
TOKENS_BY_STRATEGY = {"B": 420, "C": 420}
SHOW_FULL_OUTPUT = True
EXPORT_OUTPUT_TXT = True
EXPORT_DIR = PROMOTED_ADAPTER_DIR / "inference_test_exports"

# Deterministic proposal selection (1-based dataset row numbers).
SELECTED_PROPOSAL_ROWS = [9]

if len(SELECTED_PROPOSAL_ROWS) < 1:
    raise ValueError(
        "SELECTED_PROPOSAL_ROWS must contain at least 1 row number "
        f"(received {len(SELECTED_PROPOSAL_ROWS)})."
    )
if not all(isinstance(x, int) for x in SELECTED_PROPOSAL_ROWS):
    raise ValueError("SELECTED_PROPOSAL_ROWS must contain integers only.")
if len(set(SELECTED_PROPOSAL_ROWS)) != len(SELECTED_PROPOSAL_ROWS):
    raise ValueError("SELECTED_PROPOSAL_ROWS must not contain duplicates.")
if min(SELECTED_PROPOSAL_ROWS) < 1:
    raise ValueError("SELECTED_PROPOSAL_ROWS must use 1-based row numbers (minimum is 1).")

selected_rows_sorted = sorted(SELECTED_PROPOSAL_ROWS)
selected_row_set = set(selected_rows_sorted)


def _extract_goal_epic_titles(proposal_text: str) -> list[str]:
    goals = []
    in_goals = False
    for raw in proposal_text.splitlines():
        line = raw.strip()
        if not line:
            if in_goals:
                break
            continue

        if re.match(r"(?i)^goals?\s*:\s*$", line):
            in_goals = True
            continue

        if in_goals and re.match(r"(?i)^(timeline|features|roles|summary|status)\s*:\s*", line):
            break

        if in_goals:
            bullet = re.sub(r"^[-*+\d.)\s]+", "", line).strip()
            if bullet:
                goals.append(bullet)

    return goals[:6]


def _build_goal_anchor_block(goals: list[str]) -> str:
    if not goals:
        return ""
    lines = ["Use these exact Epic titles from Goals in this order:"]
    for idx, goal in enumerate(goals, start=1):
        lines.append(f"- Epic {idx}: {goal}")
    lines.append("Do not add or remove epics.")
    return "\n".join(lines) + "\n\n"


def _build_prompt(proposal_text: str) -> tuple[str, int]:
    goals = _extract_goal_epic_titles(proposal_text)
    expected_epic_count = len(goals) or 5
    base = proposal_text.rstrip() + "\n"
    if PROMPT_MODE == "legacy":
        goal_anchor_block = _build_goal_anchor_block(goals)
        prompt = COMPACT_STRICT_PROMPT + goal_anchor_block + "Input:\n" + proposal_text + "\n\nBacklog:\n"
    elif PROMPT_MODE == "training_exact":
        prompt = base
    elif PROMPT_MODE == "minimal_strict":
        prompt = base + _minimal_strict_guide(expected_epic_count) + "\n"
    else:
        raise RuntimeError(f"Unhandled PROMPT_MODE: {PROMPT_MODE!r}")
    return prompt, expected_epic_count


def _build_retry_prompt(proposal_text: str, expected_epic_count: int) -> str:
    """Same structure as primary; minimal_strict adds one recovery line."""
    if PROMPT_MODE == "legacy":
        return (
            COMPACT_STRICT_PROMPT
            + f"You MUST generate exactly {expected_epic_count} epics in FLAT format starting with 'Epic 1:'.\n"
            + f"Do NOT use tables (|), bullets, or prose. END with {OUTPUT_END_MARKER} on its own line.\n\n"
            + "Input:\n" + proposal_text + "\n\nBacklog (flat format only):\n"
        )
    base = proposal_text.rstrip() + "\n"
    if PROMPT_MODE == "training_exact":
        return base
    if PROMPT_MODE == "minimal_strict":
        return base + _minimal_strict_guide(expected_epic_count) + "\n" + minimal_strict_retry_suffix(
            expected_epic_count
        )
    raise RuntimeError(f"Unhandled PROMPT_MODE: {PROMPT_MODE!r}")


def _normalize_backlog_labels(text: str) -> str:
    normalized = text.split(OUTPUT_END_MARKER, 1)[0]
    normalized = re.sub(r"(?im)^\s*Backlog\s*:\s*$", "", normalized)
    normalized = re.sub(r"(?im)^\s*Goal\s*(\d+)\s*:\s*", r"Epic \1: ", normalized)
    normalized = re.sub(r"(?im)^\s*Sub[- ]?Epic\s*(\d+)\s*:\s*", r"-Sub-Epic \1: ", normalized)
    normalized = re.sub(r"(?im)^\s*User\s+Story\s+(\d+)\s*:\s*", r"-User Story \1: ", normalized)
    normalized = re.sub(r"(?im)^\s*Tasks\s*:\s*", "", normalized)
    normalized = re.sub(r"(?im)^\s*Task\s+(\d+)\s*:\s*", r"-Task \1: ", normalized)
    return normalized.strip()


def _parse_backlog_hierarchy(text: str) -> list[dict]:
    epics = []
    current_epic = None
    current_sub_epic = None
    current_story = None

    for raw in text.splitlines():
        stripped = raw.strip()
        if not stripped:
            continue

        epic_match = re.match(r"^Epic\s*(\d+)\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if epic_match:
            current_epic = {
                "idx": int(epic_match.group(1)),
                "title": epic_match.group(2).strip(),
                "sub_epics": [],
            }
            epics.append(current_epic)
            current_sub_epic = None
            current_story = None
            continue

        sub_match = re.match(r"^-?\s*Sub-?Epic\s*(\d+)\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if sub_match and current_epic is not None:
            current_sub_epic = {
                "idx": int(sub_match.group(1)),
                "title": sub_match.group(2).strip(),
                "stories": [],
            }
            current_epic["sub_epics"].append(current_sub_epic)
            current_story = None
            continue

        story_match = re.match(r"^-?\s*User\s+Story\s*(\d+)\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if story_match and current_sub_epic is not None:
            current_story = {
                "idx": int(story_match.group(1)),
                "text": story_match.group(2).strip(),
                "tasks": [],
            }
            current_sub_epic["stories"].append(current_story)
            continue

        task_match = re.match(r"^-?\s*Task\s+(\d+)\s*:\s*(.+)$", stripped, re.IGNORECASE)
        if task_match and current_story is not None:
            current_story["tasks"].append({
                "idx": int(task_match.group(1)),
                "text": task_match.group(2).strip(),
            })

    return epics


def _sanitize_backlog_response(response: str) -> str:
    text = _normalize_backlog_labels(response)
    cleaned_lines = []
    for line in text.splitlines():
        if re.match(r"(?im)^\s*(Status|Summary|Roles|Features|Timeline|Proposal\s*/\s*Input|Proposal|Requirements)\s*:", line):
            continue
        if re.match(r"(?im)^\s*(===\s*(Status|Summary|Roles|Features|Timeline|Proposal|Requirement).+===)\s*$", line):
            continue
        if line.strip():
            cleaned_lines.append(line.strip())
    return "\n".join(cleaned_lines).strip()


def _is_backlog_structure_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return False
    if re.match(r"(?i)^Epic\s*\d+\s*:", s):
        return True
    if re.match(r"(?i)^-?\s*Sub-?Epic\s*\d+\s*:", s):
        return True
    if re.match(r"(?i)^-?\s*User\s+Story\s*\d+\s*:", s):
        return True
    if re.match(r"(?i)^-?\s*Task\s*\d+\s*:", s):
        return True
    if OUTPUT_END_MARKER in s:
        return True
    return False


def _has_format_violations(raw_text: str) -> bool:
    """Detect tables / loose prose; ignore valid flat backlog lines."""
    for raw in raw_text.splitlines():
        line = raw.strip()
        if not line or _is_backlog_structure_line(line):
            continue
        if re.search(r"(\|\s*---|---|\d+\s*\|)", line):
            return True
        if re.match(r"^\*\s+[A-Z]", line):
            return True
        if re.match(r"^\d+\.\s+[A-Z][a-z]+\s+(\w+\s+)*[a-z]([.!?]|$)", line):
            return True
        if re.match(r"^\s*-\s+[A-Za-z]", line) and not re.match(r"(?i)^-?\s*sub-?epic", line):
            return True
    return False


def _has_malformed_headers(raw_text: str) -> bool:
    patterns = [
        r"(?im)^\s*Epi\s*$",
        r"(?im)^\s*C\s*\d+\s*:",
        r"(?im)^\s*-Sub-Ep(?!ic\s*\d+\s*:)",
        r"(?im)^\s*-Sub-\s*$",
        r"(?im)^\s*-User\s*$",
        r"(?im)^\s*-Task\s*$",
        r"(?im)^\s*UserStory\s*:",
        r"(?im)^\s*(Epic|Sub-Epic|User\s+Story|Task)\s+\d+\.\d+",
    ]
    return any(re.search(p, raw_text) for p in patterns)


def _has_duplicate_headers(text: str) -> bool:
    headers = []
    for line in text.splitlines():
        s = line.strip().lower()
        if re.match(r"^epic\s*\d+\s*:", s):
            headers.append(("epic", s))
        elif re.match(r"^-?\s*sub-?epic\s*\d+\s*:", s):
            headers.append(("sub_epic", s))
        elif re.match(r"^-?\s*user\s+story\s+\d+\s*:", s):
            headers.append(("story", s))
        elif re.match(r"^-?\s*task\s+\d+\s*:", s):
            headers.append(("task", s))
    return len(headers) != len(set(headers))


def _is_generic_tasking(epics: list[dict]) -> bool:
    generic_phrases = [
        "plan and execute",
        "implement module",
        "develop feature",
        "complete development",
        "perform testing",
        "integrate backend",
        "write code",
    ]
    tasks = []
    for epic in epics:
        for sub in epic["sub_epics"]:
            for story in sub["stories"]:
                for task in story["tasks"]:
                    tasks.append(task["text"].strip().lower())

    if not tasks:
        return False

    generic_count = 0
    for t in tasks:
        if any(phrase in t for phrase in generic_phrases) and len(t) < 70:
            generic_count += 1

    return generic_count == len(tasks)


def _compliance_score(
    response: str,
    expected_epic_count: int,
    has_exact_marker: bool,
    require_marker: bool = False,
    raw_response: str | None = None,
) -> dict:
    epics = _parse_backlog_hierarchy(response)
    epic_count = len(epics)
    invalid_sub_epic_count = 0
    invalid_story_count = 0
    invalid_task_count = 0

    for epic in epics:
        if len(epic["sub_epics"]) != 1:
            invalid_sub_epic_count += 1
            continue
        sub = epic["sub_epics"][0]
        if len(sub["stories"]) != 1:
            invalid_story_count += 1
            continue
        story = sub["stories"][0]
        if len(story["tasks"]) != 2:
            invalid_task_count += 1

    has_forbidden = bool(
        re.search(
            r"(?im)^\s*(Status|Summary|Roles|Features|Timeline|Proposal\s*/\s*Input|Proposal|Requirements)\s*:",
            raw_response if raw_response is not None else response,
        )
    )
    has_duplicates = _has_duplicate_headers(response)
    has_generic_tasks = _is_generic_tasking(epics)
    has_malformed_headers = _has_malformed_headers(raw_response if raw_response is not None else response)
    has_format_issues = _has_format_violations(raw_response if raw_response is not None else response)

    reason_flags = []
    if epic_count != expected_epic_count:
        reason_flags.append("goal_epic_mismatch")
    if invalid_sub_epic_count > 0:
        reason_flags.append("invalid_sub_epic_cardinality")
    if invalid_story_count > 0:
        reason_flags.append("invalid_story_cardinality")
    if invalid_task_count > 0:
        reason_flags.append("invalid_task_cardinality")
    if has_forbidden:
        reason_flags.append("forbidden_section")
    if has_duplicates:
        reason_flags.append("duplicate_headers")
    if has_generic_tasks:
        reason_flags.append("generic_tasks")
    if has_malformed_headers:
        reason_flags.append("malformed_headers")
    if has_format_issues:
        reason_flags.append("format_violation")
    if require_marker and not has_exact_marker:
        reason_flags.append("missing_exact_end_marker")

    score = 0
    if epic_count == expected_epic_count:
        score += 20
    score += max(0, expected_epic_count - abs(epic_count - expected_epic_count)) * 2
    score += max(0, (expected_epic_count - invalid_sub_epic_count)) * 5
    score += max(0, (expected_epic_count - invalid_story_count)) * 5
    score += max(0, (expected_epic_count - invalid_task_count)) * 8
    if not has_forbidden:
        score += 5
    if not has_duplicates:
        score += 4
    if not has_generic_tasks:
        score += 4
    if not has_malformed_headers:
        score += 3
    if not has_format_issues:
        score += 3
    if (not require_marker) or has_exact_marker:
        score += 6

    return {
        "score": score,
        "epic_count": epic_count,
        "expected_epic_count": expected_epic_count,
        "invalid_sub_epic_count": invalid_sub_epic_count,
        "invalid_story_count": invalid_story_count,
        "invalid_task_count": invalid_task_count,
        "has_forbidden": has_forbidden,
        "has_duplicates": has_duplicates,
        "has_generic_tasks": has_generic_tasks,
        "has_malformed_headers": has_malformed_headers,
        "has_format_issues": has_format_issues,
        "has_exact_end_marker": has_exact_marker,
        "reason_flags": reason_flags,
    }


def _generate(prompt_text: str, max_new_tokens: int = 420) -> str:
    inputs = tokenizer(prompt_text, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.cuda() for k, v in inputs.items()}

    gen_kwargs = dict(
        **inputs,
        max_new_tokens=max_new_tokens,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=tokenizer.eos_token_id,
        do_sample=False,
        repetition_penalty=1.15,
    )
    if USE_BAD_WORDS and _BAD_IDS:
        gen_kwargs["bad_words_ids"] = _BAD_IDS

    with torch.inference_mode():
        outputs = model_infer.generate(**gen_kwargs)
    return tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True).strip()


examples_by_row = {}
max_row_seen = 0
with open(dataset_file, "r", encoding="utf-8") as f:
    for row_num, line in enumerate(f, start=1):
        max_row_seen = row_num
        if row_num not in selected_row_set:
            continue
        line = line.strip()
        if not line:
            continue
        examples_by_row[row_num] = json.loads(line)
        if len(examples_by_row) == len(selected_row_set):
            break

missing_rows = [row for row in selected_rows_sorted if row not in examples_by_row]
if missing_rows:
    raise ValueError(
        f"Selected row numbers out of range for dataset ({dataset_file}). "
        f"Requested rows: {selected_rows_sorted}, loaded through row {max_row_seen}, missing: {missing_rows}."
    )

examples = [examples_by_row[row] for row in selected_rows_sorted]

_prompt_mode_banner = {
    "minimal_strict": "MINIMAL STRICT (Part 1 + newline + short rules)",
    "training_exact": "TRAINING-EXACT (Part 1 + newline only, matches prepare_dataset)",
    "legacy": "LEGACY (long COMPACT_STRICT + Input/Backlog)",
}[PROMPT_MODE]

print("=" * 80)
print(f"MODEL 2 INFERENCE TEST - {_prompt_mode_banner}")
print("=" * 80)
print(f"Quick mode: {QUICK_RUN_MODE}")
print(f"Strategies: {STRATEGIES_TO_RUN}")
print(f"Token budgets: {TOKENS_BY_STRATEGY}")
print(f"Repetition penalty: 1.15")
print(f"PROMPT_MODE: {PROMPT_MODE}")
print(f"REQUIRE_END_MARKER_FOR_PASS: {REQUIRE_END_MARKER_FOR_PASS}")
print(f"USE_BAD_WORDS: {USE_BAD_WORDS}")
print(f"Adapter path: {PROMOTED_ADAPTER_DIR}")
print(f"Dataset: {dataset_file}")
print(f"Selected dataset rows (1-based): {selected_rows_sorted}")
print(f"Examples to run: {len(examples)}")
print(f"Show full output: {SHOW_FULL_OUTPUT}")
print(f"Export txt: {EXPORT_OUTPUT_TXT}")
print("=" * 80)

pass_count = 0
export_rows = []
for idx, example in enumerate(examples, start=1):
    proposal = example["prompt"]
    prompt_base, expected_epic_count = _build_prompt(proposal)
    candidates = []

    for strategy in STRATEGIES_TO_RUN:
        prompt_x = prompt_base
        raw_x = _generate(prompt_x, max_new_tokens=TOKENS_BY_STRATEGY[strategy])
        has_marker_x = OUTPUT_END_MARKER in raw_x
        clean_x = _sanitize_backlog_response(raw_x)
        score_x = _compliance_score(
            clean_x,
            expected_epic_count=expected_epic_count,
            has_exact_marker=has_marker_x,
            require_marker=False,
            raw_response=raw_x,
        )

        needs_retry_x = bool(score_x["reason_flags"]) or not clean_x.lstrip().lower().startswith("epic 1:")
        if needs_retry_x:
            retry_x = _build_retry_prompt(proposal, expected_epic_count)
            raw_x = _generate(retry_x, max_new_tokens=min(TOKENS_BY_STRATEGY[strategy] + 80, 620))
            has_marker_x = OUTPUT_END_MARKER in raw_x
            clean_x = _sanitize_backlog_response(raw_x)
            score_x = _compliance_score(
                clean_x,
                expected_epic_count=expected_epic_count,
                has_exact_marker=has_marker_x,
                require_marker=False,
                raw_response=raw_x,
            )

        _suf = {"minimal_strict": "minimal-strict", "training_exact": "training-exact", "legacy": "legacy"}[
            PROMPT_MODE
        ]
        strategy_name = f"B: {_suf}" if strategy == "B" else f"C: {_suf}"
        candidates.append((strategy_name, clean_x, score_x, raw_x))

    if not candidates:
        raise RuntimeError("No inference strategies selected. Set STRATEGIES_TO_RUN to include B and/or C.")

    best_name, best_out, best_score, best_raw = max(candidates, key=lambda x: x[2]["score"])

    compliant = (
        best_score["epic_count"] == best_score["expected_epic_count"]
        and best_score["invalid_sub_epic_count"] == 0
        and best_score["invalid_story_count"] == 0
        and best_score["invalid_task_count"] == 0
        and not best_score["has_forbidden"]
        and not best_score["has_duplicates"]
        and not best_score["has_generic_tasks"]
        and not best_score["has_malformed_headers"]
        and not best_score["has_format_issues"]
    )
    if REQUIRE_END_MARKER_FOR_PASS:
        compliant = compliant and best_score["has_exact_end_marker"]

    print(f"\n{'=' * 80}")
    print(f"EXAMPLE {idx} (dataset row {selected_rows_sorted[idx - 1]})")
    print(f"Best strategy: {best_name} (score={best_score['score']})")
    print(
        f"Epics: {best_score['epic_count']}/{best_score['expected_epic_count']} | "
        f"Forbidden: {best_score['has_forbidden']} | "
        f"Duplicates: {best_score['has_duplicates']} | "
        f"Generic: {best_score['has_generic_tasks']} | "
        f"Malformed headers: {best_score['has_malformed_headers']} | "
        f"Format violation: {best_score['has_format_issues']} | "
        f"End marker: {best_score['has_exact_end_marker']}"
    )
    if best_score["reason_flags"]:
        print("Failure gates: " + ", ".join(best_score["reason_flags"]))
    print(f"Result: {'PASS' if compliant else 'FAIL'}")
    print("Output:")
    if SHOW_FULL_OUTPUT:
        print(best_out)
    else:
        print(best_out[:400])

    export_rows.append({
        "example": idx,
        "dataset_row": selected_rows_sorted[idx - 1],
        "best_strategy": best_name,
        "score": best_score["score"],
        "compliant": compliant,
        "epic_count": best_score["epic_count"],
        "expected_epic_count": best_score["expected_epic_count"],
        "invalid_sub_epic_count": best_score["invalid_sub_epic_count"],
        "invalid_story_count": best_score["invalid_story_count"],
        "invalid_task_count": best_score["invalid_task_count"],
        "has_forbidden": best_score["has_forbidden"],
        "has_duplicates": best_score["has_duplicates"],
        "has_generic_tasks": best_score["has_generic_tasks"],
        "has_malformed_headers": best_score["has_malformed_headers"],
        "has_format_issues": best_score["has_format_issues"],
        "has_exact_end_marker": best_score["has_exact_end_marker"],
        "failure_gates": best_score["reason_flags"],
        "proposal": proposal,
        "output": best_out,
        "raw_output": best_raw,
    })

    if compliant:
        pass_count += 1

print(f"\n{'=' * 80}")
print(f"COMPLIANCE SUMMARY: {pass_count}/{len(examples)} fully compliant")
print("=" * 80)

if EXPORT_OUTPUT_TXT:
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    export_file = EXPORT_DIR / f"model2_inference_outputs_{stamp}.txt"

    lines = []
    lines.append("MODEL 2 INFERENCE TEST")
    lines.append(f"Generated: {datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Dataset: {dataset_file}")
    lines.append(f"Selected rows (1-based): {selected_rows_sorted}")
    lines.append(f"PROMPT_MODE={PROMPT_MODE}")
    lines.append(f"Examples run: {len(examples)}")
    lines.append(f"Compliance summary: {pass_count}/{len(examples)}")
    lines.append("=" * 100)

    for row in export_rows:
        lines.append("")
        lines.append("-" * 100)
        lines.append(f"EXAMPLE {row['example']} (dataset row {row['dataset_row']})")
        lines.append(
            f"Best strategy: {row['best_strategy']} | Score: {row['score']} | Compliant: {row['compliant']}"
        )
        lines.append(
            "Checks: "
            f"epics={row['epic_count']}/{row['expected_epic_count']}, "
            f"forbidden={row['has_forbidden']}, "
            f"duplicates={row['has_duplicates']}, "
            f"generic_tasks={row['has_generic_tasks']}, "
            f"malformed_headers={row['has_malformed_headers']}, "
            f"format_issues={row['has_format_issues']}, "
            f"exact_end_marker={row['has_exact_end_marker']}"
        )
        if row["failure_gates"]:
            lines.append("Failure gates: " + ", ".join(row["failure_gates"]))
        lines.append("")
        lines.append("Proposal / Input:")
        lines.append(row["proposal"].strip())
        lines.append("")
        lines.append("Model Output:")
        lines.append(row["output"].strip())

    export_file.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nSaved inference outputs to: {export_file}")
