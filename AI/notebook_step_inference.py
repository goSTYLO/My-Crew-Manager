"""
Notebook-parity inference for Model 1 (overview) and Model 2 (backlog).
Lifts Step 7 (TrainModel1_Overview) and Step 6 (TrainModel2_Backlog) logic.
Strategy B only by default; C-fallback and backlog retry gated by env.
"""
from __future__ import annotations

import gc
import os
import re
import warnings
from pathlib import Path

from backlog_minimal_strict_prompt import (
    minimal_strict_guide,
    minimal_strict_retry_suffix,
    minimal_strict_second_retry_suffix,
)
from generated_parsers import normalize_overview_glued_headers

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

MODEL_ID = "Qwen/Qwen2-1.5B-Instruct"

# Env defaults: C-fallback OFF; backlog retry ON; use training part1 format for Model 2
ENABLE_CONDITIONAL_C_FALLBACK = os.getenv("OVERVIEW_ENABLE_C_FALLBACK", "0").strip().lower() in {"1", "true", "yes", "on"}
BACKLOG_ENABLE_RETRY = os.getenv("BACKLOG_ENABLE_RETRY", "1").strip().lower() in {"1", "true", "yes", "on"}
BACKLOG_USE_TRAINING_PART1_FORMAT = os.getenv("BACKLOG_USE_TRAINING_PART1_FORMAT", "1").strip().lower() in {"1", "true", "yes", "on"}

_BACKLOG_PROMPT_MODES = frozenset({"minimal_strict", "training_exact", "legacy"})
# Step 6 parity: short rules after Part 1 newline (default product behavior).
_BACKLOG_BAD_PHRASES = ["Instruction:", "Solution:", "```", "###"]


def _resolve_backlog_prompt_mode() -> str:
    raw = os.getenv("BACKLOG_PROMPT_MODE", "").strip().lower().replace("-", "_")
    if not raw:
        return "minimal_strict"
    if raw in _BACKLOG_PROMPT_MODES:
        return raw
    warnings.warn(
        f"Invalid BACKLOG_PROMPT_MODE={raw!r}; falling back to minimal_strict",
        UserWarning,
        stacklevel=2,
    )
    return "minimal_strict"


# Lazy-loaded state
_ai_root: Path | None = None
_overview_model = None
_overview_tokenizer = None
_backlog_model = None
_backlog_tokenizer = None


def _resolve_ai_root() -> Path:
    global _ai_root
    if _ai_root is not None:
        return _ai_root
    _cwd = Path.cwd()
    _ai_root = _cwd if (_cwd / "llms").exists() else (_cwd / "AI" if (_cwd / "AI").exists() else _cwd)
    if not (_ai_root / "llms").exists():
        raise FileNotFoundError(f"AI root not found (looked in {_cwd})")
    return _ai_root


def unload_overview_model() -> None:
    """Unload overview model only. Call after overview generation to free VRAM before backlog."""
    global _overview_model, _overview_tokenizer
    old_m, old_t = _overview_model, _overview_tokenizer
    _overview_model = None
    _overview_tokenizer = None
    del old_m, old_t
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.synchronize()
        torch.cuda.empty_cache()
    gc.collect()


def unload_backlog_model() -> None:
    """Unload backlog model only. Frees VRAM after backlog generation."""
    global _backlog_model, _backlog_tokenizer
    old_m, old_t = _backlog_model, _backlog_tokenizer
    _backlog_model = None
    _backlog_tokenizer = None
    del old_m, old_t
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.synchronize()
        torch.cuda.empty_cache()
    gc.collect()


def unload_models() -> None:
    """Unload all models and free VRAM. Call after inference when running as a script."""
    global _overview_model, _overview_tokenizer, _backlog_model, _backlog_tokenizer
    old_o, ot, old_b, bt = _overview_model, _overview_tokenizer, _backlog_model, _backlog_tokenizer
    _overview_model = None
    _overview_tokenizer = None
    _backlog_model = None
    _backlog_tokenizer = None
    del old_o, ot, old_b, bt
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.synchronize()
        torch.cuda.empty_cache()
    gc.collect()


# --- Overview (Step 7) ---

OUTPUT_END_MARKER_OVERVIEW = "END_OF_OVERVIEW"
STRICT_PROMPT_SECTIONS = ["summary", "roles", "features", "goals", "timeline"]
EXTRA_STRICT_RULE_LINES_OVERVIEW = [
    "Use each required heading exactly once; do not repeat sections.",
    "Goals must contain exactly 5 lines and each line must start with a strong verb.",
    "Timeline must include Week 1 to Week 4; each week has exactly two distinct tasks tied to Goals or Features.",
    "Do not reuse the same week text; avoid repeating task phrases across weeks.",
    "After Week 4, output END_OF_OVERVIEW and stop.",
]
VERB_HINTS = {
    "build", "define", "design", "implement", "create", "develop", "integrate", "test",
    "deploy", "optimize", "monitor", "configure", "validate", "automate", "improve", "launch",
    "deliver", "establish", "set", "enable", "analyze", "document",
}
TOKENS_OVERVIEW_B = 350
TOKENS_OVERVIEW_C = 400

_BAD_PHRASES = [
    "Instruction:", "Input:", "Solution:", "```",
    "Please continue from where you left off.", "Continue the tutorial",
]


def _load_overview_model():
    global _overview_model, _overview_tokenizer
    if _overview_model is not None:
        return _overview_model, _overview_tokenizer
    root = _resolve_ai_root()
    adapter_rel = os.getenv("PEFT_ADAPTER_PATH", "llms/fine_tune/qwen_model1_overview_lora_1p5b")
    adapter_path = Path(adapter_rel)
    if not adapter_path.is_absolute():
        adapter_path = (root / adapter_rel).resolve()
    if not adapter_path.exists():
        raise FileNotFoundError(f"Overview adapter not found: {adapter_path}")

    for _name in ("eval_trainer", "winner_model", "eval_base", "model", "trainer"):
        pass  # VRAM cleanup placeholder
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()

    base = AutoModelForCausalLM.from_pretrained(
        MODEL_ID, dtype=torch.float16, trust_remote_code=True
    )
    _overview_model = PeftModel.from_pretrained(base, str(adapter_path))
    if torch.cuda.is_available():
        _overview_model = _overview_model.to("cuda")
    _overview_model.eval()
    for p in _overview_model.parameters():
        p.requires_grad = False

    _overview_tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    return _overview_model, _overview_tokenizer


def _load_prompt_template_overview(section: str) -> str | None:
    root = _resolve_ai_root()
    path = root / "llms" / "prompts" / f"{section}_prompt.txt"
    if not path.exists():
        return None
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None


def _extract_section_rules_overview(section: str, template: str) -> list[str]:
    lines = template.splitlines()
    rules = []
    in_rules_block = False
    for line in lines:
        stripped = line.strip()
        lowered = stripped.lower()
        if not stripped or stripped.startswith("<<<"):
            continue
        if lowered.startswith("rules:"):
            in_rules_block = True
            continue
        if lowered.startswith("example format:"):
            in_rules_block = False
            continue
        if in_rules_block:
            m = re.match(r"^\d+\.\s*(.+)$", stripped)
            if m:
                rules.append(m.group(1).strip())
    return rules


def _normalize_rule_for_combined(section: str, rule: str) -> str | None:
    lowered = rule.lower()
    skip = ["exactly two spaces", "exactly four spaces", "output only the yaml block",
            "example format", "<<<", "{proposal_text}", "{roles}", "{additional_roles}"]
    if any(m in lowered for m in skip):
        return None
    if section == "goals" and ("epic" in lowered or "goal" in lowered):
        return "Goals must be project objectives and not duplicates of Features."
    if section == "timeline":
        if "exactly 4 weeks" in lowered or "week" in lowered:
            return "Timeline must include Week 1, Week 2, Week 3, and Week 4 exactly once."
        if "exactly 2 tasks" in lowered:
            return "Each week must include exactly two distinct, concrete tasks."
    if section == "summary" and "2-3" in lowered and "sentence" in lowered:
        return "Keep Summary concise at about 2-3 sentences."
    if "title case" in lowered and section == "roles":
        return "Use Title Case role names in Roles."
    return None


def _build_strict_constraints_overview() -> tuple[str, list[str], list[str]]:
    loaded = []
    all_rules = []
    max_per_section = 4
    for section in STRICT_PROMPT_SECTIONS:
        template = _load_prompt_template_overview(section)
        if not template:
            continue
        loaded.append(section)
        raw = _extract_section_rules_overview(section, template)
        normalized = []
        for rule in raw:
            mapped = _normalize_rule_for_combined(section, rule)
            if mapped and mapped not in normalized:
                normalized.append(mapped)
        all_rules.extend(normalized[:max_per_section])
    deduped = []
    seen = set()
    for rule in all_rules + EXTRA_STRICT_RULE_LINES_OVERVIEW:
        if rule not in seen:
            deduped.append(rule)
            seen.add(rule)
    if not deduped:
        return "", loaded, []
    block = "Additional strict format guidance:\n" + "\n".join(f"- {r}" for r in deduped) + "\n\n"
    return block, loaded, deduped


def _get_guided_prefix_overview() -> str:
    base = (
        "Generate ONLY the following sections in order: "
        "Title, Summary, Roles, Features, Goals, Timeline (Week 1-4).\n"
        "Use each heading once only; do not repeat sections.\n"
        "Do not include Status, Proposal/Input, or Backlog.\n"
        "Goals section rules: exactly 5 bullet lines, each line starts with a verb.\n"
        "Timeline rules: Week 1 to Week 4 only; each week has exactly two distinct tasks tied to Goals or Features.\n"
        "Do not repeat the same week text or same task phrase across multiple weeks.\n"
        f"After Week 4, output only '{OUTPUT_END_MARKER_OVERVIEW}' on its own line and stop.\n\n"
    )
    strict_block, _, _ = _build_strict_constraints_overview()
    return base + strict_block if strict_block else base


def _infer_title_from_proposal(proposal: str) -> str:
    words = re.findall(r"[A-Za-z0-9]+", proposal)
    if not words:
        return "Project Overview"
    return " ".join(words[:4]).title() + " Project"


def _normalize_headings(text: str) -> str:
    replacements = [
        (r"(?im)^\s*===\s*Title\s*===\s*$", "Title:"),
        (r"(?im)^\s*===\s*Summary\s*===\s*$", "Summary:"),
        (r"(?im)^\s*===\s*Roles\s*===\s*$", "Roles:"),
        (r"(?im)^\s*===\s*Features\s*===\s*$", "Features:"),
        (r"(?im)^\s*===\s*Goals\s*===\s*$", "Goals:"),
        (r"(?im)^\s*===\s*Timeline\s*===\s*$", "Timeline:"),
        (r"(?im)^\s*Project\s+Description\s*:\s*$", "Summary:"),
        (r"(?im)^\s*Timeline\s*\(Week\s*1-4\)\s*:\s*$", "Timeline:"),
        (r"(?im)^\s*Timeline\s*\(Week\s*2-4\)\s*:\s*$", "Timeline:"),
    ]
    for pat, repl in replacements:
        text = re.sub(pat, repl, text)
    if not re.search(r"(?im)^\s*Title\s*:", text):
        m = re.search(r"(?im)^\s*===\s*(.+?)\s*===\s*$", text)
        if m:
            text = re.sub(r"(?im)^\s*===\s*(.+?)\s*===\s*$", f"Title: {m.group(1).strip()}", text, count=1)
    text = re.sub(r"(?im)^\s*Title\s*:\s*Title\s*:\s*", "Title: ", text)
    return text


def _dedupe_and_truncate_sections(text: str) -> tuple[str, list[str]]:
    heading_pattern = re.compile(r"^\s*(Title|Summary|Roles|Features|Goals|Timeline)\s*:", re.IGNORECASE)
    lines = text.splitlines()
    seen = set()
    dups = []
    cleaned = []
    skip_block = False
    timeline_seen = False
    for line in lines:
        m = heading_pattern.match(line)
        if m:
            h = m.group(1).lower()
            if timeline_seen and h != "timeline":
                break
            if h in seen:
                dups.append(h)
                skip_block = True
                continue
            seen.add(h)
            skip_block = False
            if h == "timeline":
                timeline_seen = True
            cleaned.append(line)
            continue
        if skip_block:
            continue
        cleaned.append(line)
    timeline_start = next((i for i, l in enumerate(cleaned) if re.match(r"^\s*Timeline\s*:", l, re.I)), None)
    if timeline_start is not None:
        week4_idx = None
        for i in range(timeline_start, len(cleaned)):
            if re.match(r"^\s*Week\s*4\s*:", cleaned[i], re.I):
                week4_idx = i
                break
        if week4_idx is not None and week4_idx + 1 < len(cleaned):
            cleaned = cleaned[: week4_idx + 1]
    result = "\n".join(cleaned).strip()
    result = re.sub(r"(?im)^\s*Title\s*:\s*Title\s*:\s*", "Title: ", result)
    return result, sorted(set(dups))


def _default_timeline_block() -> list[str]:
    return [
        "Timeline:",
        "Week 1: Define scope from goals, Design feature architecture",
        "Week 2: Implement core backend flows, Build frontend interfaces",
        "Week 3: Integrate modules and APIs, Validate end-to-end behavior",
        "Week 4: Run QA and bug fixes, Deploy and monitor release",
    ]


def _extract_role_items(roles_block: str) -> list[str]:
    roles = []
    for line in (roles_block or "").splitlines():
        t = re.sub(r"^[-*\d.\)\s]+", "", line.strip()).strip()
        if t:
            roles.append(t)
    return roles


def _role_category_hits(roles_list: list[str]) -> dict[str, bool]:
    """Detect whether Roles cover PM / backend / frontend buckets (for default backfill)."""
    low = [r.lower() for r in roles_list]

    def has_project(r: str) -> bool:
        if "project" in r or "product manager" in r or "program manager" in r:
            return True
        return bool(re.search(r"\bpm\b", r))

    return {
        "project": any(has_project(r) for r in low),
        "backend": any("backend" in r for r in low),
        "frontend": any(
            "frontend" in r or "front end" in r or "front-end" in r for r in low
        ),
    }


def _extract_sections_overview(text: str) -> dict[str, str]:
    patterns = {
        "title": r"^Title\s*:\s*(.+)$",
        "summary": r"^Summary\s*:\s*([\s\S]*?)(?=^Roles\s*:|\Z)",
        "roles": r"^Roles\s*:\s*([\s\S]*?)(?=^Features\s*:|\Z)",
        "features": r"^Features\s*:\s*([\s\S]*?)(?=^Goals\s*:|\Z)",
        "goals": r"^Goals\s*:\s*([\s\S]*?)(?=^Timeline\s*:|\Z)",
        "timeline": r"^Timeline\s*:\s*([\s\S]*?)$",
    }
    out = {}
    for key, pat in patterns.items():
        m = re.search(pat, text, re.MULTILINE | re.IGNORECASE)
        if m:
            out[key] = m.group(1).strip()
    week_lines = re.findall(r"(?im)^\s*Week\s*[1-4]\s*:\s*.+$", text)
    if ("timeline" not in out or not out.get("timeline")) and week_lines:
        out["timeline"] = "\n".join(week_lines)
    return out


def _backfill_roles(response: str) -> str:
    """
    Model 1 fallback: if Roles lack obvious PM / backend / frontend coverage (keyword
    detection on each role line), append the missing defaults:
    Project Manager, Backend Developer, Frontend Developer.
    Skipped when all three buckets already match (including Product Manager / PM for "project").
    Set OVERVIEW_DISABLE_ROLE_BACKFILL=1 to disable.
    """
    if os.getenv("OVERVIEW_DISABLE_ROLE_BACKFILL", "").strip().lower() in {"1", "true", "yes", "on"}:
        return response
    sections = _extract_sections_overview(response)
    roles_block = sections.get("roles", "")
    role_items = _extract_role_items(roles_block)
    hits = _role_category_hits(role_items)
    if sum(hits.values()) == 3:
        return response
    defaults = [("project", "Project Manager"), ("backend", "Backend Developer"), ("frontend", "Frontend Developer")]
    missing = [d for cat, d in defaults if not hits[cat]]
    if not missing:
        return response
    # Use [\s\S]*? not .*? — without DOTALL, . does not match newlines, so re.sub
    # never matched typical multiline "- Role" lists and backfill silently never ran.
    pat = r"(^Roles\s*:\s*)([\s\S]*?)(?=^(?:Title|Summary|Roles|Features|Goals|Timeline)\s*:|\Z)"

    def add(m):
        h, c = m.group(1), m.group(2)
        for role in missing:
            if not re.search(rf"(?i){re.escape(role)}", c):
                c = c.rstrip() + f"\n- {role}"
        return h + c

    return re.sub(pat, add, response, flags=re.MULTILINE | re.IGNORECASE)


def _sanitize_response_overview(response: str, proposal: str) -> str:
    response = response.split(OUTPUT_END_MARKER_OVERVIEW, 1)[0]
    lines = response.splitlines()
    first_idx = None
    for i, line in enumerate(lines):
        if re.match(r"^\s*(===.+===|Title\s*:|Summary\s*:|Roles\s*:|Features\s*:|Goals\s*:|Timeline\s*:)", line, re.I):
            first_idx = i
            break
    if first_idx is not None and first_idx > 0:
        lines = lines[first_idx:]
    cleaned = []
    skip = False
    for line in lines:
        if re.match(r"^\s*(Status|Backlog|Proposal\s*/\s*Input)\s*:", line, re.I):
            skip = True
            continue
        if re.match(r"^\s*(===\s*(Status|Backlog|Proposal|Requirement)\s*===)", line, re.I):
            skip = True
            continue
        if re.match(r"^\s*(===.+===|Title\s*:|Summary\s*:|Roles\s*:|Features\s*:|Goals\s*:|Timeline\s*:)", line, re.I):
            skip = False
        if not skip:
            cleaned.append(line)
    text = "\n".join(cleaned).strip()
    text = _normalize_headings(text)
    text, _ = _dedupe_and_truncate_sections(text)
    if not re.search(r"(?im)^\s*Title\s*:", text):
        text = f"Title: {_infer_title_from_proposal(proposal)}\n" + text
    for sec in ["Summary", "Roles", "Features", "Goals", "Timeline"]:
        if not re.search(rf"(?im)^\s*{sec}\s*:", text):
            text += f"\n{sec}:\n"
    if re.search(r"(?im)^\s*Week\s*[1-4]\s*:", text) and not re.search(r"(?im)^\s*Timeline\s*:\s*$", text):
        text = re.sub(r"(?im)^\s*Week\s*1\s*:", "Timeline:\nWeek 1:", text, count=1)
    week_map = {}
    for wk, body in re.findall(r"(?im)^\s*Week\s*([1-4])\s*:\s*(.+)$", text):
        week_map[wk] = body.strip()
    if len(week_map) < 4:
        text = re.sub(r"(?ims)^\s*Timeline\s*:\s*[\s\S]*$", "\n".join(_default_timeline_block()), text, count=1)
    text, _ = _dedupe_and_truncate_sections(text)
    text = text.strip()
    text = normalize_overview_glued_headers(text)
    text = _backfill_roles(text)
    return text


def _compliance_score_overview(response: str) -> dict:
    sections = _extract_sections_overview(response)
    required = ["title", "summary", "roles", "features", "goals", "timeline"]
    missing = [k for k in required if not sections.get(k)]
    has_status = bool(re.search(r"(?im)^\s*(Status\s*:|===\s*Status\s*===)", response))
    has_backlog = bool(re.search(r"(?im)^\s*(Backlog\s*:|===\s*Backlog\s*===)", response))
    has_proposal = bool(re.search(r"(?im)^\s*(Proposal\s*/\s*Input\s*:|===\s*Proposal.*===|===\s*Requirements?\s*===)", response))
    goal_lines = []
    for raw in (sections.get("goals", "") or "").splitlines():
        line = re.sub(r"^[-*\d.\)\s]+", "", raw.strip()).strip()
        if line:
            goal_lines.append(line)

    def _is_verb_first(line: str) -> bool:
        m = re.match(r"^([A-Za-z]+)", line.strip())
        if not m:
            return False
        first = m.group(1).lower()
        return first in VERB_HINTS or first.endswith("ing")

    goals_count_issue = len(goal_lines) != 5
    goals_verb_issue = any(not _is_verb_first(line) for line in goal_lines) if goal_lines else True
    week_matches = re.findall(r"^\s*Week\s*([1-4])\s*:", response, re.MULTILINE | re.IGNORECASE)
    unique_weeks = set(week_matches)
    score = (6 - len(missing)) * 2 + len(unique_weeks)
    if not has_status: score += 1
    if not has_backlog: score += 1
    if not has_proposal: score += 1
    if not goals_count_issue: score += 2
    if not goals_verb_issue: score += 1
    return {
        "score": score,
        "missing": missing,
        "weeks": len(unique_weeks),
        "has_status": has_status,
        "has_backlog": has_backlog,
        "has_proposal": has_proposal,
        "goals_count_issue": goals_count_issue,
        "goals_verb_issue": goals_verb_issue,
    }


def _fails_quality_gate(score: dict) -> bool:
    return (
        len(score["missing"]) > 0 or score["weeks"] != 4 or score["has_status"]
        or score["has_backlog"] or score["has_proposal"]
        or score["goals_count_issue"] or score["goals_verb_issue"]
    )


def generate_overview_proposal(proposal_text: str) -> str:
    """Generate project overview (Model 1) from raw proposal. Strategy B; C fallback if enabled.
    Unloads overview model when done to free VRAM."""
    try:
        model, tokenizer = _load_overview_model()
        bad_ids = [tokenizer(x, add_special_tokens=False).input_ids for x in _BAD_PHRASES]
        bad_ids = [x for x in bad_ids if x]

        def _generate(prompt: str, max_tokens: int = TOKENS_OVERVIEW_B) -> str:
            inputs = tokenizer(prompt, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            with torch.inference_mode():
                out = model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                    do_sample=False,
                    repetition_penalty=1.05,
                    no_repeat_ngram_size=4,
                    bad_words_ids=bad_ids,
                )
            return tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True).strip()

        guided = _get_guided_prefix_overview()
        prompt_b = guided + proposal_text
        raw_b = _generate(prompt_b, TOKENS_OVERVIEW_B)
        clean_b = _sanitize_response_overview(raw_b, proposal_text)
        b_score = _compliance_score_overview(clean_b)

        should_run_c = ENABLE_CONDITIONAL_C_FALLBACK and _fails_quality_gate(b_score)
        if should_run_c:
            prompt_c = guided + proposal_text + "\n\n==="
            raw_c = _generate(prompt_c, TOKENS_OVERVIEW_C)
            clean_c = _sanitize_response_overview("===" + raw_c, proposal_text)
            c_score = _compliance_score_overview(clean_c)
            if c_score["score"] > b_score["score"]:
                return clean_c
        return clean_b
    finally:
        unload_overview_model()


# --- Backlog (Step 6) ---

OUTPUT_END_MARKER_BACKLOG = "END_OF_BACKLOG"
EXTRA_STRICT_RULE_LINES_BACKLOG = [
    "Output only flat backlog hierarchy.",
    "Map Goals to epics in exact order: Goal 1->Epic 1, Goal 2->Epic 2, etc.",
    "Use exact headers only: Epic N, -Sub-Epic 1, -User Story 1, -Task 1, -Task 2.",
    "Start with Epic 1 and continue sequentially with no skipped epic numbers.",
    "Exactly one Sub-Epic and one User Story per Epic; exactly two Tasks per User Story.",
    "No Status/Summary/Roles/Features/Timeline/Proposal sections.",
    f"After final Task 2, output {OUTPUT_END_MARKER_BACKLOG} and stop immediately.",
]
# Step 6 strategy B parity (minimal_strict / training_exact); legacy keeps longer budget.
TOKENS_BACKLOG_B_MINIMAL = 420
TOKENS_BACKLOG_RETRY_MINIMAL = min(TOKENS_BACKLOG_B_MINIMAL + 80, 620)
TOKENS_BACKLOG_B_LEGACY = 600
TOKENS_BACKLOG_RETRY_LEGACY = min(TOKENS_BACKLOG_B_LEGACY + 100, 750)
# Budget is tuned for ~5 epics (training distribution). Scale up for longer goal lists.
_BACKLOG_TOKENS_PER_EPIC_OVER_5 = int(os.getenv("BACKLOG_TOKENS_PER_EPIC_OVER_5", "110").strip() or "110")
_BACKLOG_MAX_NEW_TOKENS_CAP = int(os.getenv("BACKLOG_MAX_NEW_TOKENS_CAP", "1280").strip() or "1280")
# Small bump when goals exceed 5 (even first extra goal needs more than linear step at boundary)
_BACKLOG_TOKENS_SIXTH_GOAL_BONUS = int(os.getenv("BACKLOG_TOKENS_SIXTH_GOAL_BONUS", "64").strip() or "64")
_BACKLOG_2ND_RETRY_TOKEN_BONUS = int(os.getenv("BACKLOG_2ND_RETRY_TOKEN_BONUS", "320").strip() or "320")
# Off by default: a third generate pass often duplicates Epic 1..N; use dedupe + snap titles instead.
BACKLOG_ENABLE_SECOND_RETRY = os.getenv("BACKLOG_ENABLE_SECOND_RETRY", "0").strip().lower() in {"1", "true", "yes", "on"}


def _backlog_max_goals_fed() -> int:
    """
    Max goals from Part 1 passed into Model 2 (matches JSONL ~5-goal training; reduces epic hallucination).
    Set BACKLOG_MAX_GOALS_FED=0 to pass all goals (no cap).
    """
    raw = os.getenv("BACKLOG_MAX_GOALS_FED", "5").strip()
    if raw == "" or raw == "0":
        return 0
    return max(1, int(raw))


def _backlog_decode_token_budget(expected_epics: int, *, is_retry: bool, use_legacy_decode: bool) -> int:
    """Primary/retry max_new_tokens scaled by goal/epic count (env-tunable)."""
    if use_legacy_decode:
        base = TOKENS_BACKLOG_RETRY_LEGACY if is_retry else TOKENS_BACKLOG_B_LEGACY
    else:
        base = TOKENS_BACKLOG_RETRY_MINIMAL if is_retry else TOKENS_BACKLOG_B_MINIMAL
    extra = max(0, expected_epics - 5) * max(0, _BACKLOG_TOKENS_PER_EPIC_OVER_5)
    if expected_epics > 5:
        extra += _BACKLOG_TOKENS_SIXTH_GOAL_BONUS
    return min(max(1, _BACKLOG_MAX_NEW_TOKENS_CAP), base + extra)


def _backlog_repetition_penalty(expected_epics: int, use_legacy_decode: bool) -> float:
    """Slightly lower penalty for long backlogs to reduce early EOS (still env-overridable)."""
    if use_legacy_decode:
        return float(os.getenv("BACKLOG_REPETITION_PENALTY_LEGACY", "1.12").strip() or "1.12")
    raw = os.getenv("BACKLOG_REPETITION_PENALTY", "").strip()
    if raw:
        return float(raw)
    base = 1.18
    if expected_epics > 6:
        return 1.14
    if expected_epics > 5:
        return 1.16
    return base


def _backlog_retry_repetition_penalty(expected_epics: int, use_legacy_decode: bool) -> float:
    """Recovery passes: lower penalty to reduce premature EOS on long multi-epic outputs."""
    if use_legacy_decode:
        return float(os.getenv("BACKLOG_RETRY_REPETITION_PENALTY_LEGACY", "1.08").strip() or "1.08")
    raw = os.getenv("BACKLOG_RETRY_REPETITION_PENALTY", "").strip()
    if raw:
        return float(raw)
    if expected_epics > 6:
        return 1.05
    if expected_epics > 5:
        return 1.07
    return 1.10


def _backlog_quality_failed(
    clean_b: str,
    expected_epics: int,
    mode: str,
    raw_b: str,
) -> tuple[bool, int, int, int, int]:
    """Returns (failed, epic_count, invalid_sub, invalid_story, invalid_task)."""
    epics = _parse_backlog_hierarchy(clean_b)
    epic_count = len(epics)
    invalid_sub = sum(1 for e in epics if len(e["sub_epics"]) != 1)
    invalid_story = sum(1 for e in epics for se in e["sub_epics"] if len(se["stories"]) != 1)
    invalid_task = sum(
        1 for e in epics for se in e["sub_epics"] for st in se["stories"]
        if len(st["tasks"]) != 2
    )
    needs_marker = mode == "legacy" and OUTPUT_END_MARKER_BACKLOG not in raw_b
    bad = (
        epic_count != expected_epics
        or invalid_sub > 0
        or invalid_story > 0
        or invalid_task > 0
        or not clean_b.lstrip().lower().startswith("epic 1:")
        or needs_marker
    )
    return bad, epic_count, invalid_sub, invalid_story, invalid_task

# Backwards-compatible name: default path uses Step-6-sized budgets via generate_backlog_from_part1.
TOKENS_BACKLOG_B = TOKENS_BACKLOG_B_MINIMAL


def _load_backlog_model():
    global _backlog_model, _backlog_tokenizer
    if _backlog_model is not None:
        return _backlog_model, _backlog_tokenizer
    root = _resolve_ai_root()
    adapter_rel = os.getenv("PEFT_ADAPTER_PATH_BACKLOG", "llms/fine_tune/qwen_model2_backlog_lora_1p5b")
    adapter_path = Path(adapter_rel)
    if not adapter_path.is_absolute():
        adapter_path = (root / adapter_rel).resolve()
    if not adapter_path.exists():
        raise FileNotFoundError(f"Backlog adapter not found: {adapter_path}")

    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()

    base = AutoModelForCausalLM.from_pretrained(
        MODEL_ID, dtype=torch.float16, trust_remote_code=True
    )
    _backlog_model = PeftModel.from_pretrained(base, str(adapter_path))
    if torch.cuda.is_available():
        _backlog_model = _backlog_model.to("cuda")
    _backlog_model.eval()
    for p in _backlog_model.parameters():
        p.requires_grad = False

    _backlog_tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    return _backlog_model, _backlog_tokenizer


def _extract_goal_epic_titles(proposal_text: str) -> list[str]:
    """
    Parse Goals: section from Part 1 text (training or overview). Blank lines between
    bullets must NOT end the section — only the next major heading (Timeline, etc.).
    """
    goals = []
    in_goals = False
    for raw in proposal_text.splitlines():
        line = raw.strip()
        if not line:
            # Skip padding inside Goals; do not treat as end of section (was: break → 1 goal only).
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
    return goals[:48]


def _build_epic_anchor_block(proposal_text: str) -> str:
    goals = _extract_goal_epic_titles(proposal_text)
    if not goals:
        return ""
    lines = ["Use these exact epic anchors from Goals (keep order):"]
    for i, g in enumerate(goals, 1):
        lines.append(f"Epic {i}: {g}")
    lines.append("Do not create epics outside these anchors.")
    return "\n".join(lines) + "\n\n"


def _get_guided_prefix_backlog() -> str:
    root = _resolve_ai_root()
    backlog_path = root / "llms" / "prompts" / "backlog_prompt.txt"
    strict_rules = list(EXTRA_STRICT_RULE_LINES_BACKLOG)
    if backlog_path.exists():
        text = backlog_path.read_text(encoding="utf-8")
        in_rules = False
        for raw in text.splitlines():
            line = raw.strip()
            if not line:
                continue
            low = line.lower()
            if low.startswith("instructions:") or low.startswith("additional guidance:"):
                in_rules = True
                continue
            if low.startswith("formatting:") or low.startswith("context:"):
                continue
            if in_rules and line.startswith("-"):
                cand = line.lstrip("-").strip()
                if cand and cand not in strict_rules:
                    strict_rules.append(cand)
    strict_rules = strict_rules[:7]
    base = (
        "Generate backlog only in strict flat hierarchy.\n"
        "Goals determine epic count exactly (N goals -> N epics).\n"
        "Use no decimals. Start with Epic 1 and continue sequentially.\n"
        "Per Epic: exactly 1 Sub-Epic 1, 1 User Story 1, and Task 1 + Task 2.\n"
        "Each task must be implementation-ready with concrete deliverable language.\n\n"
        "Template:\n"
        "Epic 1: <Goal 1 title>\n"
        "-Sub-Epic 1: <phase>\n"
        " -User Story 1: As a <role>, I want <capability> so that <benefit>\n"
        "  -Task 1: <specific technical action + artifact>\n"
        "  -Task 2: <specific technical action + artifact>\n\n"
        f"After final Task 2, output {OUTPUT_END_MARKER_BACKLOG} on its own line and stop.\n"
    )
    if strict_rules:
        base += "Strict rules:\n" + "\n".join(f"- {r}" for r in strict_rules) + "\n\n"
    return base


def _normalize_backlog_labels(text: str) -> str:
    text = text.split(OUTPUT_END_MARKER_BACKLOG, 1)[0]
    text = re.sub(r"(?im)^\s*Backlog\s*:\s*$", "", text)
    text = re.sub(r"(?im)^\s*-\s*Epic\s*(\d+)\s*:\s*", r"Epic \1: ", text)
    text = re.sub(r"(?im)^\s*Goal\s*(\d+)\s*:\s*", r"Epic \1: ", text)
    text = re.sub(r"(?im)^\s*Sub[- ]?Epic\s*(\d+)\s*:\s*", r"-Sub-Epic \1: ", text)
    text = re.sub(r"(?im)^\s*User\s+Story\s+(\d+)\s*:\s*", r"-User Story \1: ", text)
    text = re.sub(r"(?im)^\s*Tasks\s*:\s*", "", text)
    text = re.sub(r"(?im)^\s*Task\s+(\d+)\s*:\s*", r"-Task \1: ", text)
    return text.strip()


def _parse_backlog_hierarchy(text: str) -> list[dict]:
    epics = []
    current_epic = None
    current_sub = None
    current_story = None
    for raw in text.splitlines():
        stripped = raw.strip()
        if not stripped:
            continue
        epic_m = re.match(r"^Epic\s*(\d+)\s*:\s*(.+)$", stripped, re.I)
        if epic_m:
            current_epic = {"idx": int(epic_m.group(1)), "title": epic_m.group(2).strip(), "sub_epics": []}
            epics.append(current_epic)
            current_sub = current_story = None
            continue
        sub_m = re.match(r"^-?\s*Sub-?Epic\s*(\d+)\s*:\s*(.+)$", stripped, re.I)
        if sub_m and current_epic:
            current_sub = {"idx": int(sub_m.group(1)), "title": sub_m.group(2).strip(), "stories": []}
            current_epic["sub_epics"].append(current_sub)
            current_story = None
            continue
        story_m = re.match(r"^-?\s*User\s+Story\s+(\d+)\s*:\s*(.+)$", stripped, re.I)
        if story_m and current_sub:
            current_story = {"idx": int(story_m.group(1)), "text": story_m.group(2).strip(), "tasks": []}
            current_sub["stories"].append(current_story)
            continue
        task_m = re.match(r"^-?\s*Task\s+(\d+)\s*:\s*(.+)$", stripped, re.I)
        if task_m and current_story:
            current_story["tasks"].append({"idx": int(task_m.group(1)), "text": task_m.group(2).strip()})
    return epics


_BACKLOG_META_BREAK = re.compile(
    r"(?i)^(the following text was generated|the following are some examples|here are some examples)\b"
)


def _backlog_meta_stops_generation(stripped: str) -> bool:
    """Hard stop for model boilerplate / disclaimers (cut remaining output)."""
    if not stripped:
        return False
    if _BACKLOG_META_BREAK.match(stripped):
        return True
    low = stripped.lower()
    # Common Qwen-style filler after a valid epic block
    if re.match(r"(?i)^note:\s*", stripped):
        return True
    if "this task has been completed" in low:
        return True
    if re.match(r"(?i)^please let me know\b", stripped):
        return True
    if "please ensure" in low and ("guidelines" in low or "template" in low or "strictly" in low):
        return True
    if stripped.strip() in {"---", "—"}:
        return True
    return False


def _is_backlog_echo_line(stripped: str) -> bool:
    """Lines that echo minimal_strict guide / disclaimers (drop, do not pass to parsers)."""
    if not stripped:
        return False
    low = stripped.lower()
    if re.match(r"(?i)^-?end epic\b", stripped):
        return True
    if re.match(r"(?i)^total epics:\s*", stripped):
        return True
    if re.match(r"(?i)^-?forbidden:\s*", stripped):
        return True
    if "please do not edit it manually" in low:
        return True
    if "<title from matching goal>" in low:
        return True
    if "<short phase label" in low:
        return True
    if "<concrete action>" in low:
        return True
    if "each epic uses exactly these line types" in low:
        return True
    if "emit only those line patterns" in low:
        return True
    # Guide echo only (avoid dropping stories that mention "goals" in prose)
    if re.match(r"(?i)^total epics:\s*\d+", stripped):
        return True
    return False


def _drop_backlog_tasks_after_two(text: str) -> str:
    """Remove -Task N: lines for N>2 (model sometimes emits long task lists under one story)."""
    out: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        task_m = re.match(r"^-?\s*Task\s+(\d+)\s*:\s*", s, re.I)
        if task_m and int(task_m.group(1)) > 2:
            continue
        out.append(line)
    return "\n".join(out).rstrip()


def _inject_epic_headers_for_stacked_subepics(text: str, goal_titles: list[str]) -> str:
    """
    If the model stacks multiple -Sub-Epic blocks under one Epic N: (missing Epic N+1:),
    insert Epic headers using Goals order so the flat parser sees one sub-epic per epic.
    """
    if len(goal_titles) < 2:
        return text
    lines = text.splitlines()
    out: list[str] = []
    sub_epic_seq_in_epic = 0
    current_epic_num = 0

    for line in lines:
        s = line.strip()
        epic_m = re.match(r"^Epic\s*(\d+)\s*:\s*(.+)$", s, re.I)
        if epic_m:
            current_epic_num = int(epic_m.group(1))
            sub_epic_seq_in_epic = 0
            out.append(line)
            continue

        if re.match(r"^-?\s*Sub-?Epic\s*\d+\s*:\s*", s, re.I):
            sub_epic_seq_in_epic += 1
            if sub_epic_seq_in_epic == 1:
                out.append(line)
                continue
            # Another Sub-Epic under the same Epic N — start Epic N+1 from Goals or drop tail junk.
            if current_epic_num < len(goal_titles):
                current_epic_num += 1
                gi = current_epic_num - 1
                title = goal_titles[gi] if gi < len(goal_titles) else f"Goal {current_epic_num}"
                out.append(f"Epic {current_epic_num}: {title}")
                sub_epic_seq_in_epic = 1
                out.append(line)
            else:
                break
            continue

        out.append(line)

    return "\n".join(out).rstrip()


def _truncate_repeated_epic1_block(text: str) -> str:
    """If the model emits Epic 1..N twice, keep only the first run (common after long decode)."""
    lines = text.splitlines()
    hits = [i for i, line in enumerate(lines) if re.match(r"^Epic\s*1\s*:", line.strip(), re.I)]
    if len(hits) < 2:
        return text
    return "\n".join(lines[: hits[1]]).rstrip()


def _snap_epic_titles_to_goals(text: str, goal_titles: list[str]) -> str:
    """Replace Epic N: titles with Goals list (fixes timeline bleed / wrong headings)."""
    if not goal_titles:
        return text
    out: list[str] = []
    for line in text.splitlines():
        m = re.match(r"^(Epic\s*)(\d+)\s*:\s*(.+)$", line.strip(), re.I)
        if m:
            idx = int(m.group(2))
            if 1 <= idx <= len(goal_titles):
                out.append(f"Epic {idx}: {goal_titles[idx - 1]}")
                continue
        out.append(line)
    return "\n".join(out).rstrip()


def _normalize_sub_epic_user_story_numbers(text: str) -> str:
    """Force training-flat numbering: Sub-Epic 1, User Story 1 per epic (model drifts to 2,3,4…)."""
    out: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        m = re.match(r"^(-?\s*Sub-?Epic\s*)\d+(\s*:\s*.+)$", s, re.I)
        if m:
            out.append(f"-Sub-Epic 1{m.group(2)}")
            continue
        m = re.match(r"^(-?\s*User\s+Story\s*)\d+(\s*:\s*.+)$", s, re.I)
        if m:
            out.append(f"-User Story 1{m.group(2)}")
            continue
        out.append(line)
    return "\n".join(out).rstrip()


def _strip_guide_echo_parentheticals(text: str) -> str:
    """Remove trailing parentheticals copied from the prompt (full user story ONLY…)."""
    out: list[str] = []
    pat = re.compile(
        r"\s*\((?:full user story[^)]*|full User Story[^)]*|full user story ONLY[^)]*)\)\s*$",
        re.I,
    )
    dup = re.compile(r"\s*\(As a [^)]{20,400}\)\s*$")
    for line in text.splitlines():
        s = pat.sub("", line)
        s = dup.sub("", s)
        out.append(s.rstrip())
    return "\n".join(out).rstrip()


def _repair_backlog_flat_shape(text: str, goal_titles: list[str]) -> str:
    """Post-process for consistent flat backlog (stacked sub-epics, excess tasks)."""
    t = _drop_backlog_tasks_after_two(text)
    t = _inject_epic_headers_for_stacked_subepics(t, goal_titles)
    t = _truncate_repeated_epic1_block(t)
    t = _snap_epic_titles_to_goals(t, goal_titles)
    t = _normalize_sub_epic_user_story_numbers(t)
    t = _strip_guide_echo_parentheticals(t)
    return t


def _strip_backlog_echo_and_meta(text: str) -> str:
    """Cut meta commentary and drop guide-echo lines (production cleanup)."""
    out_lines = []
    for line in text.splitlines():
        s = line.strip()
        if s and _backlog_meta_stops_generation(s):
            break
        if _is_backlog_echo_line(s):
            continue
        out_lines.append(line)
    return "\n".join(out_lines).rstrip()


def _sanitize_backlog_response(response: str) -> str:
    text = _normalize_backlog_labels(response)
    text = _strip_backlog_echo_and_meta(text)
    cleaned = []
    for line in text.splitlines():
        if re.match(r"(?im)^\s*(Status|Summary|Roles|Features|Timeline|Proposal\s*/\s*Input)\s*:", line):
            continue
        if re.match(r"(?im)^\s*(===\s*(Status|Summary|Roles|Features|Timeline|Proposal|Requirement).+===)\s*$", line):
            continue
        cleaned.append(line)
    text = "\n".join(cleaned).strip()
    rebuilt = []
    epic_counter = 0
    sub_exists = False
    for line in text.splitlines():
        s = line.strip()
        epic_m = re.match(r"^Epic\s*(\d+)\s*:\s*(.+)$", s, re.I)
        if epic_m:
            epic_counter = int(epic_m.group(1))
            sub_exists = False
            rebuilt.append(f"Epic {epic_counter}: {epic_m.group(2).strip()}")
            continue
        if re.match(r"^-?\s*Sub-?Epic\s*\d+\s*:\s*.+$", s, re.I):
            sub_exists = True
            rebuilt.append(s)
            continue
        if re.match(r"^-?\s*User\s+Story\s+\d+\s*:\s*.+$", s, re.I):
            if epic_counter > 0 and not sub_exists:
                rebuilt.append(f"-Sub-Epic 1: Implementation for Epic {epic_counter}")
                sub_exists = True
            rebuilt.append(s)
            continue
        # Drop decoder fragments: "-Task 4" or "-Task 4:" with no description
        if re.match(r"^-?\s*Task\s+\d+\s*$", s, re.I):
            continue
        if re.match(r"^-?\s*Task\s+\d+\s*:\s*$", s, re.I):
            continue
        rebuilt.append(s)
    return "\n".join(rebuilt).strip()


def generate_backlog_from_part1(part1: str | dict) -> str:
    """
    Generate backlog (Model 2) from overview. Strategy B; retry if enabled.

    part1: Either raw overview text (str) or parsed overview dict (from JSON).
    When dict, converts via overview_dict_to_model2_training_prompt (JSONL prompt format).
    When str and BACKLOG_USE_TRAINING_PART1_FORMAT=1, parses text then converts.

    BACKLOG_PROMPT_MODE (default minimal_strict): minimal_strict | training_exact | legacy.

    BACKLOG_MAX_GOALS_FED (default 5): keep only the first N goals in Part 1 before generation
    (training-style); set to 0 to disable and pass every goal from the overview.
    """
    import generated_parsers

    mode = _resolve_backlog_prompt_mode()
    use_legacy_decode = mode == "legacy"

    model, tokenizer = _load_backlog_model()
    bad_ids = [tokenizer(x, add_special_tokens=False).input_ids for x in _BACKLOG_BAD_PHRASES]
    bad_ids = [x for x in bad_ids if x]

    def _generate(
        prompt: str,
        max_tokens: int,
        *,
        repetition_penalty: float | None = None,
    ) -> str:
        inputs = tokenizer(prompt, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        rp = (
            repetition_penalty
            if repetition_penalty is not None
            else _backlog_repetition_penalty(expected_epics, use_legacy_decode)
        )
        gen_kwargs: dict = dict(
            **inputs,
            max_new_tokens=max_tokens,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            do_sample=False,
            repetition_penalty=rp,
            bad_words_ids=bad_ids,
        )
        if use_legacy_decode:
            gen_kwargs["no_repeat_ngram_size"] = 4
        with torch.inference_mode():
            out = model.generate(**gen_kwargs)
        return tokenizer.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True).strip()

    # Resolve overview dict when possible, then optionally cap goals (prompt + expected epics stay aligned).
    overview_dict: dict | None = None
    if isinstance(part1, dict):
        overview_dict = part1
    elif BACKLOG_USE_TRAINING_PART1_FORMAT:
        parsed = generated_parsers.parse_overview_text(part1)
        if parsed.get("title") or parsed.get("summary") or parsed.get("goals"):
            overview_dict = parsed

    max_goals = _backlog_max_goals_fed()
    if overview_dict is not None:
        od = overview_dict
        if max_goals > 0:
            goals = od.get("goals") or []
            if len(goals) > max_goals:
                print(
                    f"[BACKLOG] Capping Part 1 goals from {len(goals)} to {max_goals} "
                    f"(BACKLOG_MAX_GOALS_FED; set 0 to include all goals)"
                )
                od = {**od, "goals": goals[:max_goals]}
        prompt_input = generated_parsers.overview_dict_to_model2_training_prompt(od)
    else:
        prompt_input = part1

    goal_titles = _extract_goal_epic_titles(prompt_input)
    expected_epics = len(goal_titles) or 5
    tokens_primary = _backlog_decode_token_budget(
        expected_epics, is_retry=False, use_legacy_decode=use_legacy_decode
    )
    tokens_retry = _backlog_decode_token_budget(
        expected_epics, is_retry=True, use_legacy_decode=use_legacy_decode
    )
    base = prompt_input.rstrip() + "\n"

    if mode == "minimal_strict":
        prompt_b = base + minimal_strict_guide(expected_epics) + "\n"
    elif mode == "training_exact":
        prompt_b = base
    else:
        guided = _get_guided_prefix_backlog()
        epic_block = _build_epic_anchor_block(prompt_input)
        prompt_b = guided + epic_block + "Input:\n" + prompt_input + "\n\nBacklog:\n"

    raw_b = _generate(prompt_b, tokens_primary)
    clean_b = _sanitize_backlog_response(raw_b)
    clean_b = _repair_backlog_flat_shape(clean_b, goal_titles)
    failed, *_rest = _backlog_quality_failed(clean_b, expected_epics, mode, raw_b)
    needs_retry = BACKLOG_ENABLE_RETRY and failed

    retry_prompt: str | None = None
    if needs_retry:
        if mode == "minimal_strict":
            retry_prompt = (
                base
                + minimal_strict_guide(expected_epics)
                + "\n"
                + minimal_strict_retry_suffix(expected_epics)
            )
        elif mode == "training_exact":
            retry_prompt = base
        else:
            guided = _get_guided_prefix_backlog()
            epic_block = _build_epic_anchor_block(prompt_input)
            retry_prompt = (
                guided + epic_block + "Input:\n" + prompt_input + "\n\n"
                + "Return only flat backlog. Start with Epic 1:. Use exactly one Sub-Epic 1, one User Story 1, and Task 1/Task 2 per Epic. "
                + f"Generate exactly {expected_epics} epics. End with {OUTPUT_END_MARKER_BACKLOG}.\n\nBacklog:\n"
            )
        rrp = _backlog_retry_repetition_penalty(expected_epics, use_legacy_decode)
        raw_b = _generate(retry_prompt, tokens_retry, repetition_penalty=rrp)
        clean_b = _sanitize_backlog_response(raw_b)
        clean_b = _repair_backlog_flat_shape(clean_b, goal_titles)
        failed, *_rest = _backlog_quality_failed(clean_b, expected_epics, mode, raw_b)

    if (
        BACKLOG_ENABLE_RETRY
        and BACKLOG_ENABLE_SECOND_RETRY
        and failed
        and retry_prompt is not None
        and mode == "minimal_strict"
    ):
        tokens_r2 = min(
            _BACKLOG_MAX_NEW_TOKENS_CAP,
            tokens_retry + _BACKLOG_2ND_RETRY_TOKEN_BONUS,
        )
        second_prompt = retry_prompt + minimal_strict_second_retry_suffix(expected_epics)
        raw_b = _generate(
            second_prompt,
            tokens_r2,
            repetition_penalty=float(os.getenv("BACKLOG_SECOND_RETRY_REPETITION_PENALTY", "1.03").strip() or "1.03"),
        )
        clean_b = _sanitize_backlog_response(raw_b)
        clean_b = _repair_backlog_flat_shape(clean_b, goal_titles)

    try:
        return clean_b
    finally:
        unload_backlog_model()
