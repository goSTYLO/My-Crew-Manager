import os
import time
import json
import re # Ensure re is imported
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
from .utils.pdf_parser import extract_text_from_pdf # Updated import
from LLMs.models import (
    EpicListOutputModel,
    SubEpicListOutputModel,
    UserStoryListOutputModel,
    TaskListOutputModel,
    EpicModel,
    SubEpicModel,
    UserStoryModel,
    TaskModel,
    ProjectModel,
    BaseModel, # Import BaseModel for validate_and_parse_json type hint
    TeamMemberModel
)
from LLMs.utils.llm_utils import validate_and_parse_json # Import from utility
from pydantic import ValidationError
from typing import Optional, Type, List

# Model ID (same as project_llm)
MODEL_ID = "unsloth/mistral-7b-instruct-v0.3-bnb-4bit"

# Load pre-quantized model
def load_llm() -> HuggingFacePipeline:
    """Initialize LLM with minimal configuration"""
    print(f"🔧 Loading model: {MODEL_ID}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        device_map="auto",
        torch_dtype="auto",
        trust_remote_code=True
    )
    
    pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=2512,
        temperature=0.7,
        do_sample=True,
        return_full_text=False
    )
    
    print("✅ Model loaded and ready")
    return HuggingFacePipeline(pipeline=pipe)

# Build prompt from template
def build_prompt(section: str, proposal_text: str, context: dict = None) -> str:
    """Load and format prompt template"""
    # Adjusting prompt path to correctly locate prompts relative to backlog_llm.py
    root_dir = os.path.dirname(__file__) # Corrected root_dir
    prompt_path = os.path.join(root_dir, "prompts", f"{section}_prompt.txt")

    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            template = f.read().strip()
    except FileNotFoundError:
        print(f"⚠️ Prompt file not found: {prompt_path}")
        return ""
    except Exception as e:
        print(f"⚠️ Failed to load prompt {prompt_path}: {e}")
        return ""

    # Replace template variables
    prompt = template.replace("{proposal_text}", proposal_text)
    if context:
        for key, value in context.items():
            placeholder = f"{{{key}}}"
            if placeholder in prompt:
                prompt = prompt.replace(placeholder, str(value).strip())
    
    # Remove any remaining unreplaced placeholders (e.g., if context was not provided for an optional field)
    prompt = re.sub(r"{\w+}", "", prompt) # Use regex to remove any remaining {key} patterns

    print(f"🧠 Built prompt for: {section}")
    return prompt

# This run_backlog function is from the old structure and should be removed/refactored if not needed.

def validate_and_parse_json(section_name: str, raw_response: str, pydantic_model: Type[BaseModel]) -> Optional[BaseModel]:
    """Validate JSON response against Pydantic model and parse."""
    try:
        # Attempt to extract JSON if it's wrapped in markdown code block
        if raw_response.strip().startswith("```json") and raw_response.strip().endswith("```"): 
            json_str = raw_response.strip()[7:-3].strip()
        else:
            json_str = raw_response.strip()
            
        json_data = json.loads(json_str)
        validated_obj = pydantic_model.parse_obj(json_data)
        print(f"✅ JSON & Pydantic validation successful for {section_name}.")
        return validated_obj
    except json.JSONDecodeError as e:
        print(f"❌ JSON decoding error for {section_name}: {e}")
        print(f"   Raw response (first 200 chars): {raw_response[:200]}...")
        return None
    except ValidationError as e:
        print(f"❌ Pydantic validation error for {section_name}: {e}")
        print(f"   Raw response (first 200 chars): {raw_response[:200]}...")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred during validation for {section_name}: {e}")
        print(f"   Raw response (first 200 chars): {raw_response[:200]}...")
        return None

def generate_section(llm, section: str, prompt: str, max_retries: int = 3) -> str:
    """Generate section with improved error handling and retry mechanism."""
    for attempt in range(max_retries):
        print(f"  Attempt {attempt + 1} for {section}...")
        try:
            response = llm.invoke(prompt).strip()
            
            if not response:
                print(f"⚠️ Empty response for {section} (attempt {attempt + 1})")
                continue
                
            # Removed the quick check for JSON-like start
            # if not (response.strip().startswith('{') and response.strip().endswith('}')) and \
            #    not (response.strip().startswith('```json') and response.strip().endswith('```')):
            #     print(f"⚠️ Response for {section} does not look like JSON (attempt {attempt + 1})")
            #     # print(f"  Response: {response[:200]}...")
            #     continue

            print(f"\n--- RAW {section.upper()} (Attempt {attempt + 1}) ---\n{response}\n")
            return response
            
        except Exception as e:
            print(f"❌ Error during LLM invocation for {section} (attempt {attempt + 1}): {str(e)}")
            # Implement exponential backoff here if desired
            # time.sleep(2 ** attempt) 
            
    print(f"❌ Failed to generate {section} after {max_retries} attempts.")
    return ""

def run_backlog_pipeline(
    llm: HuggingFacePipeline,
    proposal_text: str,
    project_model_input: ProjectModel # Accept ProjectModel directly
) -> ProjectModel:
    """Main pipeline for generating Epics, Sub-Epics, User Stories, and Tasks from a ProjectModel input."""
    
    project_model = project_model_input # Use the provided ProjectModel
    
    print("\n--- Starting Backlog Generation Pipeline ---")

    # No need to parse summary, roles, or tasks again if provided in ProjectModel
    if not project_model.title or not project_model.summary:
        print("⚠️ Project title or summary is missing in the provided ProjectModel. Cannot proceed with backlog generation.")
        return project_model

    if not project_model.roles:
        print("⚠️ No team members found in the provided ProjectModel. Cannot proceed with backlog generation.")
        return project_model

    if not project_model.tasks:
        print("⚠️ No initial high-level tasks found in the provided ProjectModel. Skipping further backlog generation.")
        return project_model

    # Strictly process only the first high-level task as the Epic
    high_level_task_title = project_model.tasks[0]
    
    # Now, use high_level_task_title to generate the hierarchical backlog
    print("✨ Generating full hierarchical backlog from high-level tasks...")
    
    generated_epics: List[EpicModel] = []
    
    print(f"\nProcessing High-Level Task as Epic: {high_level_task_title}")
    
    # Create the EpicModel directly from the high_level_task_title
    current_epic = EpicModel(title=high_level_task_title, description="")

    # Generate description for the Epic
    epic_description_context = {
        "project_title": project_model.title,
        "project_summary": project_model.summary,
        "epic_title": current_epic.title
    }
    epic_description_prompt = build_prompt("epic_description", proposal_text, epic_description_context)
    raw_epic_description = generate_section(llm, "epic_description", epic_description_prompt)
    current_epic.description = raw_epic_description.strip() # Assign the raw description
                
    # Generate ONE Sub-Epic for the current Epic
    print(f"\n✨ Generating Sub-Epics for Epic: {current_epic.title}")
    sub_epic_context = {
        "epic_title": current_epic.title,
        "epic_description": current_epic.description if current_epic.description else "",
        "project_summary": project_model.summary
    }
    sub_epic_prompt = build_prompt("sub_epics", proposal_text, sub_epic_context)
    raw_sub_epics_response = generate_section(llm, "sub_epics", sub_epic_prompt)
    
    if raw_sub_epics_response:
        # Use regex to strictly get only the first sub-epic title.
        # It looks for a line that does NOT start with common problematic prefixes or numbers.
        sub_epic_title_match = re.search(
            r"^(?!\s*(?:Parent Epic Title:|Sub-Epic Titles:|\d+\.|\*\s|Breakdown Note:))\s*(.*?)(?=\n|$)",
            raw_sub_epics_response,
            re.MULTILINE | re.IGNORECASE
        )
        if sub_epic_title_match:
            sub_epic_title = sub_epic_title_match.group(1).strip()
            sub_epic = SubEpicModel(title=sub_epic_title, description="") # No description for Sub-Epic
            
            # Generate ONE User Story for the single Sub-Epic
            print(f"\n📝 Generating User Stories for Sub-Epic: {sub_epic.title}")
            user_story_context = {
                "sub_epic_title": sub_epic.title,
                "sub_epic_description": sub_epic.description if sub_epic.description else "",
                "epic_title": current_epic.title,
                "project_summary": project_model.summary
            }
            user_story_prompt = build_prompt("user_stories", proposal_text, user_story_context)
            raw_user_stories_response = generate_section(llm, "user_stories", user_story_prompt)
   
            if raw_user_stories_response:
                # Use regex to strictly get only the first user story block (title + acceptance criteria)
                # Ignores "User Story:" and "Acceptance Criteria:" prefixes if present
                user_story_block_match = re.search(
                    r"^(?:User Story:\s*)?(As a .*?)(?:\n(?:Acceptance Criteria:\s*)?((?:- .*?\n)*))?",
                    raw_user_stories_response,
                    re.MULTILINE | re.IGNORECASE
                )
                
                if user_story_block_match:
                    user_story_title = user_story_block_match.group(1).strip()
                    acceptance_criteria_raw = user_story_block_match.group(2)
                    
                    current_user_story = UserStoryModel(title=user_story_title, description="") # No description for User Story
                    if acceptance_criteria_raw:
                        current_user_story.acceptance_criteria = [line.strip()[2:] for line in acceptance_criteria_raw.splitlines() if line.strip().startswith('- ')]
                    
                    sub_epic.user_stories = [current_user_story] # Assign only the first parsed user story
                    
                    # Generate Tasks for the single User Story
                    for k, user_story in enumerate(sub_epic.user_stories): # This loop will run only once
                        print(f"\n🎯 Generating Tasks for User Story {k+1}/{len(sub_epic.user_stories)}: {user_story.title}")
                        task_context = {
                            "user_story_title": user_story.title,
                            "user_story_description": user_story.description if user_story.description else "",
                            "acceptance_criteria_list": ", ".join(user_story.acceptance_criteria),
                            "sub_epic_title": sub_epic.title,
                            "epic_title": current_epic.title,
                            "project_summary": project_model.summary
                        }
                        task_prompt = build_prompt("user_tasks", proposal_text, task_context)
                        raw_tasks_response = generate_section(llm, "user_tasks", task_prompt)
   
                        if raw_tasks_response:
                            # No slicing here, the prompt is responsible for the limit (e.g., 3 tasks)
                            task_titles = [line.strip() for line in raw_tasks_response.splitlines() if line.strip()]
                            for task_title in task_titles:
                                user_story.tasks.append(TaskModel(title=task_title, description="")) # No description for Task
            
                    current_epic.sub_epics.append(sub_epic) # Add the single sub_epic to the current_epic
            
    generated_epics.append(current_epic) # Add the single fully formed epic to the list
    
    project_model.epics = generated_epics # Assign the generated epics to the project model
    
    print(f"\n--- Backlog Generation Completed ---\n")
    return project_model

if __name__ == "__main__":
    # This block is for testing backlog_llm.py independently
    print("Running backlog_llm.py directly for testing...")
    llm_instance = load_llm()
    
    # Read the last ProjectModel from project_management.jsonl
    project_model_from_file: Optional[ProjectModel] = None
    try:
        with open("datasets/project_management.jsonl", "r", encoding="utf-8") as f:
            last_line = None
            for line in f:
                if line.strip(): # Ensure line is not empty
                    last_line = line.strip()
            if last_line:
                project_model_from_file = ProjectModel.model_validate_json(last_line)
                print(f"✅ Successfully loaded ProjectModel from project_management.jsonl")
            else:
                print("⚠️ project_management.jsonl is empty. Cannot run backlog pipeline.")
                exit()
    except FileNotFoundError:
        print("❌ project_management.jsonl not found. Please run project_llm.py first.")
        exit()
    except Exception as e:
        print(f"❌ Error loading ProjectModel from file: {e}")
        exit()

    if project_model_from_file is None:
        print("❌ Failed to load ProjectModel. Exiting.")
        exit()

    # Extract proposal_text from the loaded ProjectModel for use in building prompts
    # This assumes project_llm might store it or we re-extract for full context
    # For now, let's re-extract to ensure full proposal text is used for building backlog prompts
    full_proposal_text = extract_text_from_pdf("datasets/project_proposal.pdf") # Re-extract PDF text
    if not full_proposal_text:
        print("❌ Failed to extract proposal text from PDF. Exiting.")
        exit()

    final_project_plan = run_backlog_pipeline(
        llm_instance,
        full_proposal_text,
        project_model_input=project_model_from_file
    )
    print("\n--- Final Project Plan (JSON) ---")
    print(final_project_plan.model_dump_json(indent=2, exclude_defaults=True))