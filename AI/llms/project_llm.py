import json
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

# Prompt for single-call Part 1 JSON output (Model 1 / new pipeline)
OVERVIEW_JSON_PROMPT = """Convert this project description to structured JSON with summary, roles, features, goals, timeline.

Description:
{description}

Output valid JSON only (no markdown). Structure:
{"summary": "...", "roles": ["...", "..."], "features": ["...", "..."], "goals": [{"epic": "...", "role": "..."}], "timeline": {"week1": ["task1", "task2"], "week2": [...], ...}}
"""

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
        return "- title:" in response_lower and "role:" in response_lower
    if section == "timeline":
        return "timeline:" in response_lower and "week_number:" in response_lower
    return True

def generate_section(llm, section: str, prompt: str, max_retries: int = 3, max_tokens: int = 512, cancellation_token: Optional[CancellationToken] = None) -> str:
    for _ in range(max_retries):
        try:
            # Check for cancellation before each attempt
            if cancellation_token:
                cancellation_token.check_cancelled()

            text = None
            # Prefer direct pipeline call with per-call override if available
            if hasattr(llm, "pipeline"):
                try:
                    out = llm.pipeline(prompt, max_new_tokens=max_tokens)
                    if isinstance(out, list) and out and isinstance(out[0], dict) and "generated_text" in out[0]:
                        text = out[0]["generated_text"]
                    elif isinstance(out, str):
                        text = out
                except Exception:
                    # Fall back to invoke if pipeline call fails
                    pass

            if not text:
                # Fallback to the wrapper invoke
                text = llm.invoke(prompt)

            response = (text or "").strip()
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


def _extract_json_from_response(text: str) -> dict | None:
    """Extract JSON from LLM response (handles markdown code blocks)."""
    text = (text or "").strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        if start >= 0:
            depth = 0
            for i in range(start, len(text)):
                if text[i] == "{":
                    depth += 1
                elif text[i] == "}":
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start : i + 1])
                        except json.JSONDecodeError:
                            break
    return None


def _part1_json_to_project_model(data: dict) -> ProjectModel:
    """Map Part 1 JSON to ProjectModel."""
    model = ProjectModel()
    model.summary = (data.get("summary") or "").strip()
    if model.summary:
        first_sent = re.match(r"^(.*?\.)", model.summary)
        model.title = first_sent.group(1).strip() if first_sent else model.summary[:50]
    else:
        model.title = "Project from Proposal"

    model.roles = [TeamMemberModel(role=str(r)) for r in (data.get("roles") or [])[:20]]
    model.features = [str(f) for f in (data.get("features") or [])[:10]]

    goals_data = data.get("goals") or []
    model.goals = [
        GoalModel(title=str(g.get("epic", "")), role=str(g.get("role", "")))
        for g in goals_data if isinstance(g, dict)
    ][:20]

    timeline_data = data.get("timeline") or {}
    weeks = []
    for key in sorted(timeline_data.keys()):
        m = re.match(r"week(\d+)", key, re.IGNORECASE)
        if m:
            week_num = int(m.group(1))
            tasks = timeline_data[key]
            if isinstance(tasks, list):
                goals = [TimelineGoalModel(title=str(t)) for t in tasks[:20]]
            else:
                goals = []
            weeks.append(TimelineWeekModel(week_number=week_num, goals=goals))
    model.timeline = weeks
    return model


def run_pipeline_from_text(proposal_text: str, task_id: Optional[str] = None) -> ProjectModel:
    """Generate Part 1 overview from description. Single LLM call with JSON output."""
    if not proposal_text:
        return ProjectModel()

    cancellation_token = CancellationToken(task_id) if task_id else None
    if cancellation_token:
        cancellation_token.check_cancelled()

    llm = get_cached_llm()
    prompt = OVERVIEW_JSON_PROMPT.format(description=proposal_text.strip())

    text = None
    if hasattr(llm, "pipeline"):
        try:
            out = llm.pipeline(prompt, max_new_tokens=512)
            if isinstance(out, list) and out and isinstance(out[0], dict) and "generated_text" in out[0]:
                text = out[0]["generated_text"]
            elif isinstance(out, str):
                text = out
        except Exception:
            pass
    if not text:
        text = llm.invoke(prompt)

    response = (text or "").strip()
    data = _extract_json_from_response(response)
    if data and isinstance(data, dict) and data.get("summary"):
        return _part1_json_to_project_model(data)

    logger.warning("JSON parse failed, returning empty ProjectModel")
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