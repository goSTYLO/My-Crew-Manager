import os
import re
import logging
from llms.models import (
    ProjectModel,
    TeamMemberModel,
    TimelineWeekModel,
    TimelineGoalModel,
    GoalModel,
)
from typing import Dict, Optional
from llms.tasks import CancellationToken, TaskCancelledException
from llms.llm_cache import get_cached_llm

logger = logging.getLogger('llms')

OUTPUT_END_MARKER = "END_OF_OVERVIEW"
STRICT_PROMPT_SECTIONS = ["summary", "roles", "features", "goals", "timeline"]
M1_QUICK_MODE = os.getenv("M1_QUICK_MODE", "true").strip().lower() in {"1", "true", "yes", "on"}
M1_ENABLE_C_FALLBACK = os.getenv("M1_ENABLE_C_FALLBACK", "true").strip().lower() in {"1", "true", "yes", "on"}
M1_USE_STRICT_RULES = os.getenv("M1_USE_STRICT_RULES", "true").strip().lower() in {"1", "true", "yes", "on"}
TOKENS_BY_STRATEGY = {"A": 260, "B": 350, "C": 400}

BASE_GUIDED_PREFIX = (
    "Generate ONLY the following sections in order: "
    "Title, Summary, Roles, Features, Goals, Timeline (Week 1-4).\n"
    "Use each heading once only; do not repeat sections.\n"
    "Do not include Status, Proposal/Input, or Backlog.\n"
    "Goals section rules: exactly 5 bullet lines, each line starts with a verb.\n"
    "Timeline rules: Week 1 to Week 4 only; each week has exactly two distinct tasks tied to Goals or Features.\n"
    "Do not repeat the same week text or same task phrase across multiple weeks.\n"
    f"After Week 4, output only '{OUTPUT_END_MARKER}' on its own line and stop.\n\n"
)

EXTRA_STRICT_RULE_LINES = [
    "Use each required heading exactly once; do not repeat sections.",
    "Goals must contain exactly 5 lines and each line must start with a strong verb.",
    "Timeline must include Week 1 to Week 4; each week has exactly two distinct tasks tied to Goals or Features.",
    "Do not reuse the same week text; avoid repeating task phrases across weeks.",
    "After Week 4, output END_OF_OVERVIEW and stop.",
]

# Cache prompt templates in memory to avoid disk I/O on every call
_PROMPT_CACHE = {}

VERB_HINTS = {
    "build", "define", "design", "implement", "create", "develop", "integrate", "test",
    "deploy", "optimize", "monitor", "configure", "validate", "automate", "improve", "launch",
    "deliver", "establish", "set", "enable", "analyze", "document",
}


def _load_prompt_template(section: str) -> str:
    root_dir = os.path.dirname(__file__)
    prompt_path = os.path.join(root_dir, "prompts", f"{section}_prompt.txt")
    if section not in _PROMPT_CACHE:
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                _PROMPT_CACHE[section] = f.read().strip()
        except Exception:
            _PROMPT_CACHE[section] = ""
    return _PROMPT_CACHE.get(section, "")


def build_prompt(section: str, proposal_text: str, context: Dict = None) -> str:
    template = _load_prompt_template(section)
    if not template:
        return ""

    prompt = template.replace("{proposal_text}", proposal_text)
    if context:
        for key, value in context.items():
            prompt = prompt.replace(f"{{{key}}}", str(value).strip())

    prompt = re.sub(r"{\w+}", "", prompt)
    return prompt

def validate_section_format(section: str, response: str) -> bool:
    if not response or not isinstance(response, str):
        return False
    response_lower = response.lower().strip()
    if section == "summary":
        return response_lower.startswith("summary:")
    if section == "features":
        return response_lower.startswith("features:") and "- " in response_lower
    if section == "roles":
        return response_lower.startswith("roles:") and "- " in response_lower
    if section == "goals":
        return response_lower.startswith("goals:")
    if section == "timeline":
        return "timeline:" in response_lower and "week_number:" in response_lower
    return True


def _extract_section_rules(template: str) -> list[str]:
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


def _normalize_rule_for_combined_output(section: str, rule: str) -> str | None:
    lowered = rule.lower()
    if any(m in lowered for m in ["exactly two spaces", "yaml", "example format", "<<<", "{proposal_text}"]):
        return None
    if section == "goals" and ("epic" in lowered or "goal" in lowered):
        return "Goals must be project objectives and not duplicates of Features."
    if section == "timeline":
        if "week" in lowered:
            return "Timeline must include Week 1, Week 2, Week 3, and Week 4 exactly once."
        if "exactly 2 tasks" in lowered:
            return "Each week must include exactly two distinct, concrete tasks."
    if section == "summary" and "2-3" in lowered and "sentence" in lowered:
        return "Keep Summary concise at about 2-3 sentences."
    if section == "roles" and "title case" in lowered:
        return "Use Title Case role names in Roles."
    return None


def _build_strict_constraints_block() -> tuple[str, list[str], list[str]]:
    if not M1_USE_STRICT_RULES:
        return "", [], []
    loaded_sections = []
    all_rules = []
    for section in STRICT_PROMPT_SECTIONS:
        template = _load_prompt_template(section)
        if not template:
            continue
        loaded_sections.append(section)
        raw_rules = _extract_section_rules(template)
        for rule in raw_rules:
            mapped = _normalize_rule_for_combined_output(section, rule)
            if mapped and mapped not in all_rules:
                all_rules.append(mapped)
    for extra in EXTRA_STRICT_RULE_LINES:
        if extra not in all_rules:
            all_rules.append(extra)
    if not all_rules:
        return "", loaded_sections, []
    deduped = list(dict.fromkeys(all_rules))
    block = "Additional strict format guidance:\n" + "\n".join(f"- {r}" for r in deduped) + "\n\n"
    return block, loaded_sections, deduped


def _build_guided_prefix() -> str:
    block, _, _ = _build_strict_constraints_block()
    return BASE_GUIDED_PREFIX + block


def _default_timeline_block() -> list[str]:
    return [
        "Timeline:",
        "Week 1: Define scope from goals, Design feature architecture",
        "Week 2: Implement core backend flows, Build frontend interfaces",
        "Week 3: Integrate modules and APIs, Validate end-to-end behavior",
        "Week 4: Run QA and bug fixes, Deploy and monitor release",
    ]


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
        (r"(?im)^\s*Timeline\s*\(Week\s*1-4\)\s*:\s*$", "Timeline:"),
        (r"(?im)^\s*Timeline\s*\(Week\s*2-4\)\s*:\s*$", "Timeline:"),
        (r"(?im)^\s*Project\s+Description\s*:\s*$", "Summary:"),
    ]
    for pattern, repl in replacements:
        text = re.sub(pattern, repl, text)
    if not re.search(r"(?im)^\s*Title\s*:", text):
        m = re.search(r"(?im)^\s*===\s*(.+?)\s*===\s*$", text)
        if m:
            title_text = m.group(1).strip()
            text = re.sub(r"(?im)^\s*===\s*(.+?)\s*===\s*$", f"Title: {title_text}", text, count=1)
    return re.sub(r"(?im)^\s*Title\s*:\s*Title\s*:\s*", "Title: ", text)


def _extract_sections(text: str) -> dict[str, str]:
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
        m = re.search(pat, text, flags=re.MULTILINE | re.IGNORECASE)
        if m:
            out[key] = m.group(1).strip()
    week_lines = re.findall(r"(?im)^\s*Week\s*[1-4]\s*:\s*.+$", text)
    if ("timeline" not in out or not out["timeline"]) and week_lines:
        out["timeline"] = "\n".join(week_lines)
    return out


def _has_duplicate_section_headers(text: str) -> bool:
    headers = re.findall(r"(?im)^\s*(Title|Summary|Roles|Features|Goals|Timeline)\s*:", text)
    seen = set()
    for h in headers:
        key = h.lower()
        if key in seen:
            return True
        seen.add(key)
    return False


def _dedupe_and_truncate_sections(text: str) -> tuple[str, list[str]]:
    heading_pattern = re.compile(r"^\s*(Title|Summary|Roles|Features|Goals|Timeline)\s*:", re.IGNORECASE)
    lines = text.splitlines()
    seen_headers = set()
    duplicate_headers = []
    cleaned_lines = []
    skip_duplicate_block = False
    timeline_seen = False

    for line in lines:
        m = heading_pattern.match(line)
        if m:
            header = m.group(1).lower()
            if timeline_seen and header != "timeline":
                break
            if header in seen_headers:
                duplicate_headers.append(header)
                skip_duplicate_block = True
                continue
            seen_headers.add(header)
            skip_duplicate_block = False
            if header == "timeline":
                timeline_seen = True
            cleaned_lines.append(line)
            continue
        if skip_duplicate_block:
            continue
        cleaned_lines.append(line)

    timeline_start = next(
        (i for i, line in enumerate(cleaned_lines) if re.match(r"^\s*Timeline\s*:", line, re.IGNORECASE)),
        None,
    )
    if timeline_start is not None:
        week4_idx = None
        for i in range(timeline_start, len(cleaned_lines)):
            if re.match(r"^\s*Week\s*4\s*:", cleaned_lines[i], re.IGNORECASE):
                week4_idx = i
                break
        if week4_idx is not None and week4_idx + 1 < len(cleaned_lines):
            cleaned_lines = cleaned_lines[:week4_idx + 1]

    cleaned_text = "\n".join(cleaned_lines).strip()
    cleaned_text = re.sub(r"(?im)^\s*Title\s*:\s*Title\s*:\s*", "Title: ", cleaned_text)
    return cleaned_text, sorted(set(duplicate_headers))


def _extract_goal_lines(goals_block: str) -> list[str]:
    if not goals_block.strip():
        return []
    lines = []
    for raw in goals_block.splitlines():
        line = raw.strip()
        if not line:
            continue
        line = re.sub(r"^[-*+\d\.\)\s]+", "", line).strip()
        if line:
            lines.append(line)
    return lines


def _is_verb_first(line: str) -> bool:
    m = re.match(r"^([A-Za-z]+)", line.strip())
    if not m:
        return False
    first = m.group(1).lower()
    return first in VERB_HINTS or first.endswith("ing")


def _extract_role_items(roles_block: str) -> list[str]:
    if not roles_block.strip():
        return []
    roles = []
    for line in roles_block.splitlines():
        text = line.strip()
        if not text:
            continue
        text = re.sub(r"^[-*+\d\.\)\s]+", "", text).strip()
        if text:
            roles.append(text)
    return roles


def _role_category_hits(roles_list: list[str]) -> dict[str, bool]:
    roles_lower = [r.lower() for r in roles_list]
    return {
        "project": any("project" in role for role in roles_lower),
        "backend": any("backend" in role for role in roles_lower),
        "frontend": any(("frontend" in role) or ("front end" in role) for role in roles_lower),
    }


def _has_all_default_roles(roles_list: list[str]) -> tuple[bool, int]:
    hits = _role_category_hits(roles_list)
    found_count = sum(1 for v in hits.values() if v)
    return found_count == 3, found_count


def _has_repeated_week_text(response: str) -> bool:
    bodies = [re.sub(r"\s+", " ", body.strip().lower()) for _, body in re.findall(r"(?im)^\s*Week\s*([1-4])\s*:\s*(.+)$", response)]
    if len(bodies) < 4:
        return False
    return len(set(bodies)) < len(bodies)


def _backfill_roles(response: str) -> str:
    sections = _extract_sections(response)
    roles_block = sections.get("roles", "")
    role_items = _extract_role_items(roles_block)

    has_all, _ = _has_all_default_roles(role_items)
    if has_all:
        return response

    hits = _role_category_hits(role_items)
    category_defaults = [
        ("project", "Project Manager"),
        ("backend", "Backend Developer"),
        ("frontend", "Frontend Developer"),
    ]
    missing_defaults = [default for category, default in category_defaults if not hits[category]]

    if missing_defaults:
        roles_pattern = r"(^Roles\s*:\s*)(.*?)(?=^[A-Z][a-zA-Z]+\s*:|$)"

        def add_missing(match):
            header = match.group(1)
            content = match.group(2)
            for role in missing_defaults:
                if not re.search(rf"(?i){re.escape(role)}", content):
                    content = content.rstrip() + f"\n- {role}"
            return header + content

        response = re.sub(roles_pattern, add_missing, response, flags=re.MULTILINE | re.IGNORECASE)

    return response


def _sanitize_response(response: str, proposal: str) -> str:
    response = (response or "").split(OUTPUT_END_MARKER, 1)[0]
    lines = response.splitlines()

    first_section_idx = None
    for i, line in enumerate(lines):
        if re.match(r"^\s*(===.+===|Title\s*:|Summary\s*:|Roles\s*:|Features\s*:|Goals\s*:|Timeline\s*:)", line, re.IGNORECASE):
            first_section_idx = i
            break
    if first_section_idx is not None and first_section_idx > 0:
        lines = lines[first_section_idx:]

    cleaned = []
    skip = False
    for line in lines:
        if re.match(r"^\s*(Status|Backlog|Proposal\s*/\s*Input)\s*:", line, re.IGNORECASE):
            skip = True
            continue
        if re.match(r"^\s*(===\s*(Status|Backlog|Proposal|Requirement)\s*===)", line, re.IGNORECASE):
            skip = True
            continue
        if re.match(r"^\s*(===.+===|Title\s*:|Summary\s*:|Roles\s*:|Features\s*:|Goals\s*:|Timeline\s*:)", line, re.IGNORECASE):
            skip = False
        if not skip:
            cleaned.append(line)

    text = "\n".join(cleaned).strip()
    text = _normalize_headings(text)
    text, _ = _dedupe_and_truncate_sections(text)

    if not re.search(r"(?im)^\s*Title\s*:", text):
        title_guess = _infer_title_from_proposal(proposal)
        text = f"Title: {title_guess}\n" + text

    for sec in ["Summary", "Roles", "Features", "Goals", "Timeline"]:
        if not re.search(rf"(?im)^\s*{sec}\s*:", text):
            text += f"\n{sec}:\n"

    if re.search(r"(?im)^\s*Week\s*[1-4]\s*:", text) and not re.search(r"(?im)^\s*Timeline\s*:\s*$", text):
        text = re.sub(r"(?im)^\s*Week\s*1\s*:", "Timeline:\nWeek 1:", text, count=1)

    week_map = {}
    for wk, body in re.findall(r"(?im)^\s*Week\s*([1-4])\s*:\s*(.+)$", text):
        week_map[wk] = body.strip()

    if len(week_map) < 4:
        text = re.sub(
            r"(?ims)^\s*Timeline\s*:\s*[\s\S]*$",
            "\n".join(_default_timeline_block()),
            text,
            count=1,
        )

    text, _ = _dedupe_and_truncate_sections(text)
    text = _backfill_roles(text.strip())
    return text.strip()


def _extract_items(block: str) -> list[str]:
    items = []
    for line in (block or "").splitlines():
        clean = re.sub(r"^\s*[-*+\d\.)\s]+", "", line).strip()
        if clean:
            items.append(clean)
    return items


def _is_generic_timeline(text: str) -> bool:
    bodies = [b.strip().lower() for _, b in re.findall(r"(?im)^\s*Week\s*([1-4])\s*:\s*(.+)$", text)]
    if len(bodies) < 4:
        return True
    generic_markers = ["plan and execute", "key deliverables", "implementation", "development"]
    generic_hits = sum(1 for b in bodies if any(m in b for m in generic_markers))
    return generic_hits >= 2 or len(set(bodies)) < len(bodies)


def _compliance_score(text: str) -> dict:
    sections = _extract_sections(text)
    required = ["title", "summary", "roles", "features", "goals", "timeline"]
    missing = [k for k in required if not sections.get(k)]
    has_status = bool(re.search(r"(?im)^\s*(Status\s*:|===\s*Status\s*===)", text))
    has_backlog = bool(re.search(r"(?im)^\s*(Backlog\s*:|===\s*Backlog\s*===)", text))
    has_proposal = bool(re.search(r"(?im)^\s*(Proposal\s*/\s*Input\s*:|===\s*Proposal.*===|===\s*Requirements?\s*===)", text))
    goal_lines = _extract_goal_lines(sections.get("goals", ""))
    goals_count_issue = len(goal_lines) != 5
    goals_verb_issue = any(not _is_verb_first(line) for line in goal_lines) if goal_lines else True
    role_items = _extract_role_items(sections.get("roles", ""))
    has_all_defaults, default_roles_count = _has_all_default_roles(role_items)
    weeks = {w for w, _ in re.findall(r"(?im)^\s*Week\s*([1-4])\s*:\s*(.+)$", text)}
    has_repeated_weeks = _has_repeated_week_text(text)

    score = 0
    score += (6 - len(missing)) * 2
    score += len(weeks)
    if not has_status:
        score += 1
    if not has_backlog:
        score += 1
    if not has_proposal:
        score += 1
    if not _is_generic_timeline(text):
        score += 2
    if not goals_count_issue:
        score += 2
    if not goals_verb_issue:
        score += 1
    if has_all_defaults:
        score += 2
    elif default_roles_count == 2:
        score += 1

    return {
        "score": score,
        "missing": missing,
        "weeks": len(weeks),
        "has_status": has_status,
        "has_backlog": has_backlog,
        "has_proposal": has_proposal,
        "has_duplicate_sections": _has_duplicate_section_headers(text),
        "has_generic_timeline": _is_generic_timeline(text),
        "has_repeated_weeks": has_repeated_weeks,
        "goals_count_issue": goals_count_issue,
        "goals_verb_issue": goals_verb_issue,
        "goal_lines": goal_lines,
        "has_default_roles": has_all_defaults,
        "default_roles_count": default_roles_count,
    }


def _fails_quality_gate(score: dict) -> bool:
    return (
        bool(score["missing"])
        or score["weeks"] != 4
        or score["has_status"]
        or score["has_backlog"]
        or score["has_proposal"]
        or score["has_duplicate_sections"]
        or score["has_generic_timeline"]
        or score["has_repeated_weeks"]
        or score["goals_count_issue"]
        or score["goals_verb_issue"]
    )


def _generate_raw(llm, prompt: str, max_tokens: int, cancellation_token: Optional[CancellationToken] = None) -> str:
    if cancellation_token:
        cancellation_token.check_cancelled()
    text = None
    if hasattr(llm, "pipeline"):
        kwargs = {
            "max_new_tokens": max_tokens,
            "do_sample": False,
            "repetition_penalty": 1.05,
            "no_repeat_ngram_size": 4,
            "return_full_text": False,
        }
        try:
            tokenizer = getattr(llm.pipeline, "tokenizer", None)
            if tokenizer is not None:
                bad_phrases = ["Instruction:", "Input:", "Solution:", "```", "Continue the tutorial"]
                bad_ids = [tokenizer(x, add_special_tokens=False).input_ids for x in bad_phrases]
                bad_ids = [x for x in bad_ids if x]
                if bad_ids:
                    kwargs["bad_words_ids"] = bad_ids
        except Exception:
            pass
        try:
            out = llm.pipeline(prompt, **kwargs)
            if isinstance(out, list) and out and isinstance(out[0], dict) and "generated_text" in out[0]:
                text = out[0]["generated_text"]
            elif isinstance(out, str):
                text = out
        except Exception:
            text = None
    if not text:
        text = llm.invoke(prompt)
    return (text or "").strip()


def _part1_text_to_project_model(text: str) -> ProjectModel:
    sections = _extract_sections(text)
    model = ProjectModel()
    model.title = sections.get("title") or "Project from Proposal"
    model.summary = sections.get("summary") or ""
    model.roles = [TeamMemberModel(role=r) for r in _extract_items(sections.get("roles", ""))[:20]]
    model.features = _extract_items(sections.get("features", ""))[:10]
    model.goals = [GoalModel(title=g, role="") for g in _extract_items(sections.get("goals", ""))[:20]]

    weeks = []
    for week, body in re.findall(r"(?im)^\s*Week\s*([1-4])\s*:\s*(.+)$", sections.get("timeline", "")):
        tasks = [t.strip() for t in body.split(",") if t.strip()][:2]
        goals = [TimelineGoalModel(title=t) for t in tasks]
        weeks.append(TimelineWeekModel(week_number=int(week), goals=goals))
    model.timeline = sorted(weeks, key=lambda x: x.week_number)
    return model


def generate_section(llm, section: str, prompt: str, max_retries: int = 3, max_tokens: int = 512, cancellation_token: Optional[CancellationToken] = None) -> str:
    for _ in range(max_retries):
        try:
            # Check for cancellation before each attempt
            if cancellation_token:
                cancellation_token.check_cancelled()

            response = _generate_raw(llm, prompt, max_tokens=max_tokens, cancellation_token=cancellation_token)
            if not response:
                continue
            if not validate_section_format(section, response):
                continue
            return response
        except TaskCancelledException:
            raise  # Re-raise cancellation exceptions
        except Exception:
            continue
    return ""


def parity_generate_overview(proposal_text: str) -> ProjectModel:
    """
    Parity-mode overview generation: Strategy B only, strict gates with fail-fast.
    
    Used for pre-integration testing against notebook baseline.
    Returns ProjectModel on success; raises ValueError if gates fail.
    No retry or fallback logic.
    
    Args:
        proposal_text: Raw proposal description to generate overview from.
        
    Returns:
        ProjectModel with all 6 sections populated.
        
    Raises:
        ValueError: If any quality gate fails.
    """
    if not proposal_text:
        raise ValueError("Proposal text cannot be empty")
    
    proposal_text = proposal_text.strip()
    llm = get_cached_llm()
    guided_prefix = _build_guided_prefix()
    
    # Strategy B only: guided prefix + 350 tokens, single attempt
    raw_response = _generate_raw(llm, guided_prefix + proposal_text, TOKENS_BY_STRATEGY["B"])
    if not raw_response:
        raise ValueError("LLM returned empty response")
    
    # Sanitize strictly
    clean_text = _sanitize_response(raw_response, proposal_text)
    
    # Score and validate gates
    score_dict = _compliance_score(clean_text)
    
    # Check quality gates: ALL must pass
    if _fails_quality_gate(score_dict):
        gate_failures = []
        if score_dict["missing"]:
            gate_failures.append(f"missing sections: {score_dict['missing']}")
        if score_dict["weeks"] != 4:
            gate_failures.append(f"week count: {score_dict['weeks']} (expected 4)")
        if score_dict["has_status"]:
            gate_failures.append("contains Status section (forbidden)")
        if score_dict["has_backlog"]:
            gate_failures.append("contains Backlog section (forbidden)")
        if score_dict["has_proposal"]:
            gate_failures.append("contains Proposal/Input section (forbidden)")
        if score_dict["has_duplicate_sections"]:
            gate_failures.append("duplicate section headers found")
        if score_dict["has_generic_timeline"]:
            gate_failures.append("timeline is generic (not project-specific)")
        if score_dict["has_repeated_weeks"]:
            gate_failures.append("repeated week text detected")
        if score_dict["goals_count_issue"]:
            gate_failures.append(f"goal count: {len(score_dict['goal_lines'])} (expected 5)")
        if score_dict["goals_verb_issue"]:
            gate_failures.append("goals missing verb-first requirement")
        
        raise ValueError(
            f"Parity mode quality gate failure (score={score_dict['score']}/26): "
            f"{'; '.join(gate_failures)}"
        )
    
    logger.info(f"Parity mode: Strategy B passed all gates (score={score_dict['score']}/26)")
    return _part1_text_to_project_model(clean_text)


def run_pipeline_from_text(proposal_text: str, task_id: Optional[str] = None) -> ProjectModel:
    """Generate Part 1 overview from description using Step 7-style runtime behavior."""
    if not proposal_text:
        return ProjectModel()

    cancellation_token = CancellationToken(task_id) if task_id else None
    if cancellation_token:
        cancellation_token.check_cancelled()

    llm = get_cached_llm()
    proposal_text = proposal_text.strip()

    strategies = ["B"] if M1_QUICK_MODE else ["A", "B", "C"]
    guided_prefix = _build_guided_prefix()
    candidates = []

    if "A" in strategies:
        raw_a = _generate_raw(llm, proposal_text, TOKENS_BY_STRATEGY["A"], cancellation_token)
        clean_a = _sanitize_response(raw_a, proposal_text)
        score_a = _compliance_score(clean_a)
        candidates.append(("A", clean_a, score_a))

    raw_b = _generate_raw(llm, guided_prefix + proposal_text, TOKENS_BY_STRATEGY["B"], cancellation_token)
    clean_b = _sanitize_response(raw_b, proposal_text)
    score_b = _compliance_score(clean_b)
    candidates.append(("B", clean_b, score_b))

    should_run_c = ("C" in strategies) or (M1_ENABLE_C_FALLBACK and _fails_quality_gate(score_b))
    if should_run_c:
        raw_c = _generate_raw(llm, guided_prefix + proposal_text + "\n\n===", TOKENS_BY_STRATEGY["C"], cancellation_token)
        clean_c = _sanitize_response("===" + raw_c, proposal_text)
        score_c = _compliance_score(clean_c)
        candidates.append(("C", clean_c, score_c))

    if candidates:
        best_name, best_text, best_score = max(candidates, key=lambda x: x[2]["score"])
        logger.info(f"Model1 strategy selected: {best_name}; score={best_score}")
        if not _fails_quality_gate(best_score):
            return _part1_text_to_project_model(best_text)
        best_effort = _part1_text_to_project_model(best_text)
        if best_effort.summary or best_effort.features or best_effort.goals:
            return best_effort

    logger.warning("Overview generation failed quality gates")
    return ProjectModel()

def model_to_dict(project_model: ProjectModel) -> dict:
    return {
        "title": project_model.title,
        "summary": project_model.summary,
        "features": project_model.features,
        "roles": [r.role for r in project_model.roles],
        "goals": [{"title": g.title, "role": g.role} for g in project_model.goals],
        "timeline": [
            {
                "week_number": week.week_number,
                "goals": [goal.title for goal in week.goals]
            }
            for week in project_model.timeline
        ]
    }