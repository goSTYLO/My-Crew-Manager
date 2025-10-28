import os
import re
import logging
from llms.models import (
    ProjectModel,
    TeamMemberModel,
    TimelineWeekModel,
    TimelineGoalModel
)
from typing import Dict, Optional
from apps.ai_api.tasks import CancellationToken, TaskCancelledException
from llms.llm_cache import get_cached_llm

logger = logging.getLogger('llms')

def build_prompt(section: str, proposal_text: str, context: Dict = None) -> str:
    root_dir = os.path.dirname(__file__)
    prompt_path = os.path.join(root_dir, "prompts", f"{section}_prompt.txt")

    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            template = f.read().strip()
    except Exception:
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

def generate_section(llm, section: str, prompt: str, max_retries: int = 3, cancellation_token: Optional[CancellationToken] = None) -> str:
    for _ in range(max_retries):
        try:
            # Check for cancellation before each attempt
            if cancellation_token:
                cancellation_token.check_cancelled()
            
            response = llm.invoke(prompt).strip()
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

def run_pipeline_from_text(proposal_text: str, task_id: Optional[str] = None) -> ProjectModel:
    if not proposal_text:
        return ProjectModel()

    # Create cancellation token if task_id is provided
    cancellation_token = CancellationToken(task_id) if task_id else None

    llm = get_cached_llm()  # Uses singleton cache - model loaded only once per server lifetime
    project_model = ProjectModel()
    raw_outputs = {}
    sections = ["summary", "features", "roles", "goals", "timeline"]

    context = {
        "proposal_text": proposal_text,
        "project_title": "",
        "project_summary": "",
        "overarching_goals": "",
        "additional_roles": "",
        "goals": ""
    }

    for section in sections:
        # Check for cancellation before each section
        if cancellation_token:
            cancellation_token.check_cancelled()
        
        context["project_title"] = project_model.title or ""
        context["project_summary"] = project_model.summary or ""
        context["overarching_goals"] = ", ".join(project_model.features)
        context["additional_roles"] = "\n".join([r.role for r in project_model.roles]) if project_model.roles else ""

        if section == "timeline" and "goals" in raw_outputs:
            goal_titles = []
            for line in raw_outputs["goals"].splitlines():
                if line.strip().startswith("- title:"):
                    title = line.strip()[len("- title:"):].strip()
                    goal_titles.append(title)
            context["goals"] = "\n".join(goal_titles)

        prompt = build_prompt(section, proposal_text, context)
        if prompt:
            raw_response = generate_section(llm, section, prompt, cancellation_token=cancellation_token)
            if raw_response:
                logger.debug(f"RAW {section.upper()}: {raw_response}")
                raw_outputs[section] = raw_response

    if "summary" in raw_outputs:
        match = re.search(r"summary:\s*(.*)", raw_outputs["summary"], re.DOTALL | re.IGNORECASE)
        if match:
            project_model.summary = match.group(1).strip()
            first_sentence = re.match(r"^(.*?\.)", project_model.summary)
            project_model.title = first_sentence.group(1).strip() if first_sentence else "Project from Proposal"
        else:
            project_model.summary = raw_outputs["summary"]
            project_model.title = "Project from Proposal"

    if "features" in raw_outputs:
        lines = [line.strip()[2:] for line in raw_outputs["features"].splitlines() if line.strip().startswith("- ")]
        project_model.features = [re.sub(r"^\(Optional:\)\s*", "", line) for line in lines[:5]]

    if "roles" in raw_outputs:
        roles = [TeamMemberModel(role=line.strip()[2:].strip()) for line in raw_outputs["roles"].splitlines() if line.strip().startswith("- ")]
        project_model.roles = roles

    if "goals" in raw_outputs:
        goal_lines = raw_outputs["goals"].splitlines()
        parsed_goals = []
        current_goal = {}

        for line in goal_lines:
            line = line.strip()
            if line.startswith("- title:"):
                if current_goal:
                    parsed_goals.append(current_goal)
                current_goal = {"title": line[len("- title:"):].strip(), "role": ""}
            elif line.startswith("role:") and current_goal:
                current_goal["role"] = line[len("role:"):].strip()

        if current_goal:
            parsed_goals.append(current_goal)

        project_model.goals = parsed_goals

    if "timeline" in raw_outputs:
        try:
            match = re.search(r"timeline:\s*\n([\s\S]*)", raw_outputs["timeline"], re.DOTALL | re.IGNORECASE)
            if match:
                timeline_str = match.group(1).strip()
                weeks = []
                current_week = None
                current_goals = []
                for line in timeline_str.splitlines():
                    line = line.strip()
                    week_match = re.match(r"^-?\s*week_number:\s*(\d+)", line, re.IGNORECASE)
                    goal_match = re.match(r"^-\s*(.*)", line)
                    if week_match:
                        if current_week is not None:
                            weeks.append(TimelineWeekModel(week_number=current_week, goals=current_goals))
                        current_week = int(week_match.group(1))
                        current_goals = []
                    elif goal_match and current_week is not None:
                        current_goals.append(TimelineGoalModel(title=goal_match.group(1).strip()))
                if current_week is not None:
                    weeks.append(TimelineWeekModel(week_number=current_week, goals=current_goals))
                project_model.timeline = weeks
        except Exception:
            pass

    return project_model

def model_to_dict(project_model: ProjectModel) -> dict:
    return {
        "title": project_model.title,
        "summary": project_model.summary,
        "features": project_model.features,
        "roles": [r.role for r in project_model.roles],
        "goals": project_model.goals,
        "timeline": [
            {
                "week_number": week.week_number,
                "goals": [goal.title for goal in week.goals]
            }
            for week in project_model.timeline
        ]
    }