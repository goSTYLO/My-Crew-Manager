import os
import json
import re
import logging
from typing import Dict, Optional
from llms.tasks import CancellationToken, TaskCancelledException
from llms.models import BacklogModel, EpicModel, SubEpicModel, UserStoryModel, TaskModel
from llms.llm_cache import get_cached_backlog_llm

logger = logging.getLogger('llms')

BACKLOG_FROM_PART1_PROMPT = """Given this structured project overview (JSON), generate backlog text in this strict format.

Rules:
- Epic count must match the number of goals.
- Exactly one Sub-Epic per Epic.
- Exactly one User Story per Sub-Epic.
- Exactly two Tasks per User Story.
- Use flat numbering only for Sub-Epic/User Story/Task: always 1, 1, and Tasks 1-2.
- No sections besides Epic/Sub-Epic/User Story/Task.
- After final task, output END_OF_BACKLOG.

Format:
Epic <n>: <Goal title>
-Sub-Epic 1: <implementation phase>
 -User Story 1: As a <role>, I want <capability> so that <benefit>
    -Task 1: <specific implementation action>
    -Task 2: <specific implementation action>

Input JSON:
{part1_json}

Backlog:
"""

OUTPUT_END_MARKER = "END_OF_BACKLOG"
M2_QUICK_MODE = os.getenv("M2_QUICK_MODE", "true").strip().lower() in {"1", "true", "yes", "on"}
M2_MAX_RETRIES = int(os.getenv("M2_MAX_RETRIES", "3"))
TOKENS_BY_STRATEGY = {"B": 420}

# Cache prompt templates in memory to avoid disk I/O on every call
_PROMPT_CACHE = {}

def build_prompt(section: str, proposal_text: str, context: Dict = None) -> str:
    # Check cache first
    if section not in _PROMPT_CACHE:
        root_dir = os.path.dirname(__file__)
        prompt_path = os.path.join(root_dir, "prompts", f"{section}_prompt.txt")
        try:
            with open(prompt_path, "r", encoding="utf-8") as f:
                _PROMPT_CACHE[section] = f.read().strip()
        except Exception:
            return ""
    
    template = _PROMPT_CACHE.get(section, "")
    if not template:
        return ""

    prompt = template.replace("{proposal_text}", proposal_text)
    if context:
        for key, value in context.items():
            prompt = prompt.replace(f"{{{key}}}", str(value).strip())

    prompt = re.sub(r"{\w+}", "", prompt)
    return prompt

def _extract_expected_epic_count(proposal_text: str | None = None, part1_json: str | None = None) -> int:
    if part1_json:
        try:
            data = json.loads(part1_json)
            goals = data.get("goals") if isinstance(data, dict) else None
            if isinstance(goals, list):
                return len(goals)
        except Exception:
            pass
    if proposal_text:
        m = re.search(r"(?ims)^\s*Goals\s*:\s*([\s\S]*?)(?=^\s*Timeline\s*:|\Z)", proposal_text)
        if m:
            lines = [re.sub(r"^\s*[-*+\d\.)\s]+", "", ln).strip() for ln in m.group(1).splitlines()]
            lines = [ln for ln in lines if ln]
            return len(lines)
    return 0


def _extract_goal_titles_from_part1_json(part1_json: str) -> list[str]:
    try:
        data = json.loads(part1_json)
    except Exception:
        return []
    if not isinstance(data, dict):
        return []
    goals = data.get("goals")
    if not isinstance(goals, list):
        return []
    titles = []
    for g in goals:
        if isinstance(g, dict):
            title = str(g.get("title") or g.get("epic") or "").strip()
            if title:
                titles.append(title)
        elif isinstance(g, str):
            title = g.strip()
            if title:
                titles.append(title)
    return titles


def _extract_goal_titles_from_proposal(proposal_text: str | None) -> list[str]:
    if not proposal_text:
        return []
    m = re.search(r"(?ims)^\s*Goals\s*:\s*([\s\S]*?)(?=^\s*Timeline\s*:|\Z)", proposal_text)
    if not m:
        return []
    titles = []
    for ln in m.group(1).splitlines():
        clean = re.sub(r"^\s*[-*+\d\.)\s]+", "", ln).strip()
        if clean:
            titles.append(clean)
    return titles


def _build_epic_anchor_block(goal_titles: list[str]) -> str:
    if not goal_titles:
        return ""
    lines = [
        "Goal-to-Epic anchors (must be one-to-one, in this order):",
    ]
    for idx, goal in enumerate(goal_titles, start=1):
        lines.append(f"- Epic {idx} maps to goal: {goal}")
    lines.append("Do not add extra epics or omit any goal.")
    return "\n".join(lines) + "\n\n"


def _normalize_backlog_text(raw_text: str) -> str:
    text = (raw_text or "")
    text = text.split(OUTPUT_END_MARKER, 1)[0]
    text = re.sub(r"```(?:text)?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"(?im)^\s*(Backlog\s*:|Model Output\s*:|Output\s*:|Backlog Hierarchy\s*:|End of backlog\s*:).*$", "", text)
    lines = []
    for line in text.splitlines():
        clean = line.rstrip()
        clean = clean.replace("\u2013", "-").replace("\u2014", "-").replace("\u2022", "-")
        clean = re.sub(r"^\s*\*\s*", "-", clean)
        if clean.strip():
            lines.append(clean)
    return "\n".join(lines).strip()


def _has_malformed_headers(text: str) -> bool:
    bad_decimal = re.search(r"(?im)^\s*[-*+\s]*(Epic|Sub\s*-?\s*Epic|User\s*Story|Task)\s+\d+\.\d+\s*:", text)
    bad_story = re.search(r"(?im)^\s*[-*+\s]*User\s*Story\s+\d+\.\d+\.\d+\s*:", text)
    bad_task = re.search(r"(?im)^\s*[-*+\s]*Task\s+\d+\.\d+\.\d+\s*:", text)
    return bool(bad_decimal or bad_story or bad_task)


def _has_duplicate_headers(text: str) -> bool:
    headers = re.findall(r"(?im)^\s*[-*+\s]*(Epic\s*\d+|Sub\s*-?\s*Epic\s*\d*|User\s*Story\s*\d*|Task\s*\d*)\s*:", text)
    normalized = [re.sub(r"\s+", " ", h.strip().lower()) for h in headers]
    return len(set(normalized)) < len(normalized) if normalized else False


def _is_generic_tasking(text: str) -> bool:
    generic_markers = [
        "implement core deliverable",
        "do development",
        "complete implementation",
        "work on feature",
        "build functionality",
    ]
    lowered = text.lower()
    return any(marker in lowered for marker in generic_markers)


def _validates_noise(text: str) -> bool:
    if _is_noisy_backlog(text):
        return False
    if _has_malformed_headers(text):
        return False
    if _has_duplicate_headers(text):
        return False
    if _is_generic_tasking(text):
        return False
    return True


def _parse_labeled_line(line: str) -> tuple[str, str] | None:
    stripped = line.strip()
    patterns = [
        ("epic", r"^[-*+\s]*Epic\s*\d+\s*:\s*(.+)$"),
        ("sub_epic", r"^[-*+\s]*Sub\s*-?\s*Epic\s*\d*\s*:\s*(.+)$"),
        ("user_story", r"^[-*+\s]*User\s*Story\s*\d*\s*:\s*(.+)$"),
        ("task", r"^[-*+\s]*Task\s*\d*\s*:\s*(.+)$"),
    ]
    for kind, pat in patterns:
        m = re.match(pat, stripped, flags=re.IGNORECASE)
        if m:
            return kind, m.group(1).strip()
    return None


def _is_noisy_backlog(text: str) -> bool:
    forbidden = ["status:", "summary:", "roles:", "features:", "timeline:", "proposal / input", "requirement"]
    lowered = text.lower()
    return any(f in lowered for f in forbidden)


def _validate_backlog_model(backlog: BacklogModel, expected_epics: int) -> bool:
    if expected_epics > 0 and len(backlog.epics) != expected_epics:
        return False
    if not backlog.epics:
        return False
    for idx, epic in enumerate(backlog.epics, start=1):
        if not epic.title.lower().startswith(f"epic {idx}:"):
            return False
    for epic in backlog.epics:
        if len(epic.sub_epics) != 1:
            return False
        sub = epic.sub_epics[0]
        if len(sub.user_stories) != 1:
            return False
        story = sub.user_stories[0]
        if len(story.tasks) != 2:
            return False
    return True


def _generate_raw(llm, prompt: str, max_tokens: int, cancellation_token: Optional[CancellationToken] = None) -> str:
    if cancellation_token:
        cancellation_token.check_cancelled()
    text = None
    if hasattr(llm, "pipeline"):
        try:
            out = llm.pipeline(
                prompt,
                max_new_tokens=max_tokens,
                do_sample=False,
                repetition_penalty=1.05,
                no_repeat_ngram_size=4,
                return_full_text=False,
            )
            if isinstance(out, list) and out and isinstance(out[0], dict) and "generated_text" in out[0]:
                text = out[0]["generated_text"]
            elif isinstance(out, str):
                text = out
        except Exception:
            text = None
    if not text:
        text = llm.invoke(prompt)
    return (text or "").strip()

def generate_section(llm, section: str, prompt: str, max_retries: int = 3, max_tokens: int = 768, cancellation_token: Optional[CancellationToken] = None) -> str:
    for _ in range(max_retries):
        try:
            if cancellation_token:
                cancellation_token.check_cancelled()
            response = _generate_raw(llm, prompt, max_tokens=max_tokens, cancellation_token=cancellation_token)
            if not response:
                continue
            return response
        except TaskCancelledException:
            raise  # Re-raise cancellation exceptions
        except Exception:
            continue
    return ""

def parse_backlog(raw_text: str) -> BacklogModel:
    backlog = BacklogModel()
    current_epic = None
    current_sub_epic = None
    current_user_story = None

    normalized = _normalize_backlog_text(raw_text)
    for raw_line in normalized.splitlines():
        parsed = _parse_labeled_line(raw_line)
        if not parsed:
            continue
        kind, content = parsed

        if kind == "epic":
            epic_num = len(backlog.epics) + 1
            current_epic = EpicModel(title=f"Epic {epic_num}: {content}", description="", ai=True)
            backlog.epics.append(current_epic)
            current_sub_epic = None
            current_user_story = None
            continue

        if kind == "sub_epic" and current_epic:
            current_sub_epic = SubEpicModel(title=f"-Sub-Epic 1: {content}", ai=True)
            current_epic.sub_epics = [current_sub_epic]
            current_user_story = None
            continue

        if kind == "user_story" and current_sub_epic:
            current_user_story = UserStoryModel(title=f"-User Story 1: {content}", ai=True)
            current_sub_epic.user_stories = [current_user_story]
            continue

        if kind == "task" and current_user_story:
            task_num = len(current_user_story.tasks) + 1
            if task_num <= 2:
                current_user_story.tasks.append(
                    TaskModel(title=f"-Task {task_num}: {content}", description="", status="pending", ai=True)
                )

    return backlog

def parity_generate_backlog(
    proposal_text: str | None = None,
    context: Dict | None = None,
    part1_json: str | None = None,
) -> BacklogModel:
    """
    Parity-mode backlog generation: single attempt, strict hierarchy validation with fail-fast.
    
    Used for pre-integration testing against notebook baseline.
    Returns BacklogModel on success; raises ValueError if gates fail.
    No retry logic; 420 tokens only.
    
    Args:
        proposal_text: Optional proposal text (for compatibility).
        context: Optional context dict.
        part1_json: Preferred - structured project overview JSON from Part 1.
        
    Returns:
        BacklogModel with strict 1-1-2 hierarchy (epic:sub-epic:story:tasks).
        
    Raises:
        ValueError: If any validation gate fails.
    """
    expected_epics = _extract_expected_epic_count(proposal_text=proposal_text, part1_json=part1_json)
    
    if expected_epics <= 0:
        raise ValueError("Unable to determine expected epic count from Part 1 or proposal")
    
    goal_titles = []
    if part1_json and part1_json.strip():
        goal_titles = _extract_goal_titles_from_part1_json(part1_json.strip())
        anchor = _build_epic_anchor_block(goal_titles)
        prompt = anchor + BACKLOG_FROM_PART1_PROMPT.format(part1_json=part1_json.strip())
    elif proposal_text and proposal_text.strip():
        goal_titles = _extract_goal_titles_from_proposal(proposal_text)
        anchor = _build_epic_anchor_block(goal_titles)
        ctx = context or {}
        ctx.setdefault("proposal_text", proposal_text)
        prompt = anchor + build_prompt("backlog", proposal_text, ctx)
    else:
        raise ValueError("Either part1_json or proposal_text must be provided")
    
    if not prompt:
        raise ValueError("Failed to build backlog prompt")
    
    llm = get_cached_backlog_llm()
    
    # Single attempt only: 420 tokens (no progression, no retry)
    raw_backlog = generate_section(
        llm,
        "backlog",
        prompt,
        max_retries=1,
        max_tokens=420,
        cancellation_token=None,
    )
    
    # Strict validation: all gates must pass
    validation_errors = []
    
    if OUTPUT_END_MARKER not in raw_backlog:
        validation_errors.append("missing END_OF_BACKLOG marker")
    
    cleaned = _normalize_backlog_text(raw_backlog)
    
    if not cleaned:
        validation_errors.append("normalized text is empty")
    elif _validates_noise(cleaned) is False:
        validation_errors.append("output contains noise or invalid structure")
    
    if not validation_errors and not re.match(r"(?im)^\s*Epic\s*1\s*:", cleaned):
        validation_errors.append("does not start with Epic 1")
    
    if validation_errors:
        raise ValueError(
            f"Parity mode backlog validation failed: {'; '.join(validation_errors)}"
        )
    
    backlog_model = parse_backlog(cleaned)
    
    # Check hierarchy cardinality: all gates must pass
    if len(backlog_model.epics) != expected_epics:
        raise ValueError(
            f"Epic count mismatch: parsed {len(backlog_model.epics)}, expected {expected_epics}"
        )
    
    # Validate each epic's sub-epic/story/task counts
    for idx, epic in enumerate(backlog_model.epics, start=1):
        if len(epic.sub_epics) != 1:
            raise ValueError(
                f"Epic {idx}: sub-epic count is {len(epic.sub_epics)}, expected 1"
            )
        
        sub = epic.sub_epics[0]
        if len(sub.user_stories) != 1:
            raise ValueError(
                f"Epic {idx}, Sub-Epic 1: user story count is {len(sub.user_stories)}, expected 1"
            )
        
        story = sub.user_stories[0]
        if len(story.tasks) != 2:
            raise ValueError(
                f"Epic {idx}, Sub-Epic 1, User Story 1: task count is {len(story.tasks)}, expected 2"
            )
    
    logger.info(f"Parity mode: backlog passed all gates (epics={expected_epics})")
    return backlog_model

def run_backlog_pipeline(
    proposal_text: str | None = None,
    context: Dict | None = None,
    part1_json: str | None = None,
    task_id: Optional[str] = None,
) -> BacklogModel:
    """Generate strict backlog. Prefer part1_json; allow proposal_text compatibility input."""
    cancellation_token = CancellationToken(task_id) if task_id else None
    if cancellation_token:
        cancellation_token.check_cancelled()

    expected_epics = _extract_expected_epic_count(proposal_text=proposal_text, part1_json=part1_json)

    goal_titles = []
    if part1_json and part1_json.strip():
        goal_titles = _extract_goal_titles_from_part1_json(part1_json.strip())
        anchor = _build_epic_anchor_block(goal_titles)
        prompt = anchor + BACKLOG_FROM_PART1_PROMPT.format(part1_json=part1_json.strip())
    elif proposal_text and proposal_text.strip():
        goal_titles = _extract_goal_titles_from_proposal(proposal_text)
        anchor = _build_epic_anchor_block(goal_titles)
        ctx = context or {}
        ctx.setdefault("proposal_text", proposal_text)
        prompt = anchor + build_prompt("backlog", proposal_text, ctx)
    else:
        return BacklogModel()

    if not prompt:
        return BacklogModel()

    llm = get_cached_backlog_llm()

    max_retries = M2_MAX_RETRIES if M2_QUICK_MODE else max(4, M2_MAX_RETRIES)
    max_tokens = TOKENS_BY_STRATEGY["B"] if M2_QUICK_MODE else 700

    for attempt in range(max_retries):
        if cancellation_token:
            cancellation_token.check_cancelled()
        current_max_tokens = min(max_tokens + (100 if attempt > 0 else 0), 620)
        raw_backlog = generate_section(
            llm,
            "backlog",
            prompt,
            max_retries=1,
            max_tokens=current_max_tokens,
            cancellation_token=cancellation_token,
        )
        if OUTPUT_END_MARKER not in raw_backlog:
            logger.warning(f"Backlog output missing end marker on attempt {attempt + 1}/{max_retries}")
            continue
        cleaned = _normalize_backlog_text(raw_backlog)
        if not cleaned or not _validates_noise(cleaned):
            logger.warning(f"Backlog generation noisy/empty on attempt {attempt + 1}/{max_retries}")
            continue
        if not re.match(r"(?im)^\s*Epic\s*1\s*:", cleaned):
            logger.warning(f"Backlog generation did not start with Epic 1 on attempt {attempt + 1}/{max_retries}")
            continue
        backlog_model = parse_backlog(cleaned)
        if _validate_backlog_model(backlog_model, expected_epics):
            return backlog_model
        logger.warning(
            f"Backlog structure invalid on attempt {attempt + 1}/{max_retries}: "
            f"expected_epics={expected_epics}, parsed_epics={len(backlog_model.epics)}"
        )

    logger.warning("Backlog generation failed strict hierarchy validation")
    return BacklogModel()