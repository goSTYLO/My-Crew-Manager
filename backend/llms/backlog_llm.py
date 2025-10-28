import os
import re
import logging
from typing import Dict, Optional
from apps.ai_api.tasks import CancellationToken, TaskCancelledException
from llms.models import BacklogModel, EpicModel, SubEpicModel, UserStoryModel, TaskModel
from llms.llm_cache import get_cached_backlog_llm

logger = logging.getLogger('llms')

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

def validate_backlog_format(response: str) -> bool:
    """Validate that the backlog response has the expected format with Epic, Sub-Epic, User Story, and Task entries."""
    if not response or not isinstance(response, str):
        return False
    
    response_lower = response.lower().strip()
    
    # Check for the specific format expected by the parser
    # Must have Epic entries with colons
    has_epic = "epic" in response_lower and ":" in response
    # Must have Task entries (can be -Task or Task)
    has_task = "-task" in response_lower or "task" in response_lower
    
    # Check for proper indentation structure (Epic, then indented Sub-Epic, etc.)
    lines = response.splitlines()
    epic_count = sum(1 for line in lines if line.strip().lower().startswith("epic") and ":" in line)
    task_count = sum(1 for line in lines if line.strip().lower().startswith("-task") and ":" in line)
    
    # Require minimum of 4 epics and at least one task for a valid backlog
    return has_epic and has_task and epic_count >= 4 and task_count > 0

def generate_section(llm, section: str, prompt: str, max_retries: int = 3, max_tokens: int = 768, cancellation_token: Optional[CancellationToken] = None) -> str:
    # Temporarily override pipeline's max_new_tokens for this call
    original_max = llm.pipeline.max_new_tokens
    llm.pipeline.max_new_tokens = max_tokens
    
    try:
        for _ in range(max_retries):
            try:
                # Check for cancellation before each attempt
                if cancellation_token:
                    cancellation_token.check_cancelled()
                
                response = llm.invoke(prompt).strip()
                if not response:
                    continue
                if not validate_backlog_format(response):
                    lines = response.splitlines()
                    epic_count = sum(1 for line in lines if line.strip().lower().startswith("epic") and ":" in line)
                    task_count = sum(1 for line in lines if line.strip().lower().startswith("-task") and ":" in line)
                    logger.warning(f"Backlog validation failed, retrying... (attempt {_ + 1}/{max_retries})")
                    logger.warning(f"Epic count: {epic_count} (need >=4), Task count: {task_count}")
                    logger.debug(f"Response preview: {response[:200]}...")
                    continue
                return response
            except TaskCancelledException:
                raise  # Re-raise cancellation exceptions
            except Exception:
                continue
        return ""
    finally:
        llm.pipeline.max_new_tokens = original_max

def parse_backlog(raw_text: str) -> BacklogModel:
    backlog = BacklogModel()
    current_epic = None
    current_sub_epic = None
    current_user_story = None

    for line in raw_text.splitlines():
        line = line.strip()

        if line.startswith("Epic"):
            label, content = line.split(":", 1)
            title = f"{label.strip()}: {content.strip()}"
            task_hint = ""
            if "*(covers:" in title:
                title_part, task_hint = title.split("*(covers:", 1)
                title = title_part.strip()
                task_hint = task_hint.rstrip(")*").strip()
                title = f"{title} *(covers: {task_hint})*"
            current_epic = EpicModel(
                title=title,
                description=f"Derived from task: {task_hint}" if task_hint else "",
                ai=True
            )
            backlog.epics.append(current_epic)

        elif line.startswith("-Sub-Epic") and current_epic:
            label, content = line.split(":", 1)
            title = f"{label.strip()}: {content.strip()}"
            current_sub_epic = SubEpicModel(title=title, ai=True)
            current_epic.sub_epics.append(current_sub_epic)

        elif line.startswith("-User Story") and current_sub_epic:
            label, content = line.split(":", 1)
            title = f"{label.strip()}: {content.strip()}"
            current_user_story = UserStoryModel(title=title, ai=True)
            current_sub_epic.user_stories.append(current_user_story)

        elif line.startswith("-Task") and current_user_story:
            label, content = line.split(":", 1)
            title = f"{label.strip()}: {content.strip()}"
            task = TaskModel(
                title=title,
                description="",
                status="pending",
                ai=True
            )
            current_user_story.tasks.append(task)

    return backlog

def run_backlog_pipeline(proposal_text: str, context: Dict, task_id: Optional[str] = None) -> BacklogModel:
    if not proposal_text:
        return BacklogModel()

    # Create cancellation token if task_id is provided
    cancellation_token = CancellationToken(task_id) if task_id else None

    # Check for cancellation before starting
    if cancellation_token:
        cancellation_token.check_cancelled()

    llm = get_cached_backlog_llm()  # Uses dedicated backlog model cache - separate from project model
    prompt = build_prompt("backlog", proposal_text, context)
    if not prompt:
        return BacklogModel()

    raw_backlog = generate_section(llm, "backlog", prompt, max_tokens=768, cancellation_token=cancellation_token)
    if not raw_backlog:
        return BacklogModel()

    logger.debug(f"RAW BACKLOG: {raw_backlog}")
    
    backlog_model = parse_backlog(raw_backlog)
    
    # Ensure minimum of 4 epics - add generic epics if needed
    if len(backlog_model.epics) < 4:
        logger.warning(f"Only {len(backlog_model.epics)} epics generated, adding generic epics to reach minimum of 4")
        generic_epics = [
            ("User Interface", "User Interface Development"),
            ("Data Management", "Data Storage and Management"),
            ("Security", "Security Implementation"),
            ("Testing", "Testing and Quality Assurance")
        ]
        
        for i, (title, description) in enumerate(generic_epics):
            if len(backlog_model.epics) >= 4:
                break
            epic_num = len(backlog_model.epics) + 1
            epic = EpicModel(
                title=f"Epic {epic_num}: {title}",
                description=description,
                ai=True
            )
            # Add a basic sub-epic, user story, and tasks
            sub_epic = SubEpicModel(title=f"-Sub-Epic {epic_num}.1: {title} Implementation", ai=True)
            user_story = UserStoryModel(title=f"-User Story {epic_num}.1.1: As a developer, I need to implement {title.lower()} functionality", ai=True)
            
            task1 = TaskModel(title=f"-Task {epic_num}.1.1.1: Design {title.lower()} components", description="", status="pending", ai=True)
            task2 = TaskModel(title=f"-Task {epic_num}.1.1.2: Implement {title.lower()} functionality", description="", status="pending", ai=True)
            
            user_story.tasks = [task1, task2]
            sub_epic.user_stories = [user_story]
            epic.sub_epics = [sub_epic]
            backlog_model.epics.append(epic)
    
    return backlog_model