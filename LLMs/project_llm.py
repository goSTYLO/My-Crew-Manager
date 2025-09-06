import os
import re
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
from .utils.pdf_parser import extract_text_from_pdf # Updated import
from LLMs.models import (
    ProjectModel,
    ProjectSummaryModel,
    TeamMembersOutputModel,
    EpicListOutputModel,
    TeamMemberModel,
    TimelineWeekModel, # Import the new model
    TimelineTaskModel # Import the new model
)
from LLMs.utils.llm_utils import validate_and_parse_json
from pydantic import ValidationError
from typing import Optional, List

MODEL_ID = "unsloth/mistral-7b-instruct-v0.3-bnb-4bit"

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
        max_new_tokens=2512, # Increased token limit for secondary LLM calls
        temperature=0.7,
        do_sample=True,
        return_full_text=False
    )
    
    print("✅ Model loaded and ready")
    return HuggingFacePipeline(pipeline=pipe)

def build_prompt(section: str, proposal_text: str, context: dict = None) -> str:
    """Load and format prompt template"""
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
    prompt = re.sub(r"{\w+}", "", prompt)

    print(f"🧠 Built prompt for: {section}")
    return prompt

def validate_section_format(section: str, response: str) -> bool:
    """Validate section-specific format requirements for raw text output"""
    if not response or not isinstance(response, str):
        return False
        
    response_lower = response.lower().strip()
    
    # Section-specific validation
    if section == "summary":
        return response_lower.startswith("summary:")
        
    elif section == "features":
        return (response_lower.startswith("features:") and 
                "- " in response_lower)
                
    elif section == "roles":
        return (response_lower.startswith("roles:") and 
                "- " in response_lower)
                
    elif section == "tasks":
        # For tasks, we expect a markdown list of titles
        return "- title:" in response_lower 
                
    elif section == "timeline":
        return ("timeline:" in response_lower and 
                "week_number:" in response_lower)
                
    return True

def generate_section(llm, section: str, prompt: str, max_retries: int = 5) -> str:
    """Generate section with improved validation for raw text output"""
    for attempt in range(max_retries):
        print(f"  Attempt {attempt + 1} for {section}...")
        try:
            response = llm.invoke(prompt).strip()
            
            if not response:
                print(f"⚠️ Empty response for {section} (attempt {attempt + 1})")
                continue
                
            # Validate format
            if not validate_section_format(section, response):
                print(f"⚠️ Invalid format for {section} (attempt {attempt + 1})")
                continue
                
            print(f"\n--- RAW {section.upper()} (Attempt {attempt + 1}) ---\n{response}\n")
            return response
            
        except Exception as e:
            print(f"❌ Error during LLM invocation for {section} (attempt {attempt + 1}): {str(e)}")
            # Implement exponential backoff here if desired
            # time.sleep(2 ** attempt) 
            
    print(f"❌ Failed to generate {section} after {max_retries} attempts.")
    return ""

def run_pipeline(proposal_path: str = "datasets/project_proposal4.pdf") -> ProjectModel:
    """Main pipeline for initial project data extraction and structuring."""
    # Load proposal
    proposal_text = extract_text_from_pdf(proposal_path) # Updated to extract_text_from_pdf
    if not proposal_text:
        print("⚠️ Empty proposal text")
        return ProjectModel() # Return an empty ProjectModel

    # Initialize model
    llm = load_llm()
    project_model = ProjectModel() # Initialize a new ProjectModel instance

    raw_outputs = {} # To store raw outputs from initial LLM calls
    
    sections_to_process = ["summary", "features", "roles", "tasks", "timeline"]
    
    for section in sections_to_process:
        print(f"\n🚀 Generating: {section.upper()}")
        
        context = {
            "proposal_text": proposal_text, # Always pass full proposal for context
            "project_title": project_model.title if project_model.title else "",
            "project_summary": project_model.summary if project_model.summary else "",
            "overarching_goals": ", ".join(project_model.features) if project_model.features else "",
            "additional_roles": "", # For tasks_prompt
            "tasks": "" # For timeline_prompt
        }

        # For tasks section, we need roles as context if available
        if section == "tasks" and "roles" in raw_outputs:
            # Extract role titles for context from raw roles output
            role_lines = [line.strip() for line in raw_outputs["roles"].splitlines() if line.strip().startswith("- ")]
            context["additional_roles"] = "\n".join([line[2:].strip() for line in role_lines]) # Pass just role titles

        # For timeline section, we need tasks as context if available
        if section == "timeline" and "tasks" in raw_outputs:
            # Extract task titles for context from raw tasks output
            task_titles = []
            for line in raw_outputs["tasks"].splitlines():
                title_match = re.match(r"^-\s*title:\s*(.*)", line.strip(), re.IGNORECASE)
                if title_match:
                    task_titles.append(title_match.group(1).strip())
            context["tasks"] = "\n".join(task_titles) # Pass just task titles

        prompt = build_prompt(section, proposal_text, context)
        if prompt:
            raw_response = generate_section(llm, section, prompt)
            if raw_response:
                raw_outputs[section] = raw_response

    # --- Post-processing raw outputs into ProjectModel --- #

    # 1. Process Summary
    if "summary" in raw_outputs:
        # Use a more robust regex to capture the summary content after "summary: "
        summary_match = re.search(r"summary:\s*(.*)", raw_outputs["summary"], re.DOTALL | re.IGNORECASE)
        if summary_match:
            project_model.summary = summary_match.group(1).strip()
            # Attempt to infer project_title from the first sentence of the summary
            first_sentence_match = re.match(r"^(.*?\.)", project_model.summary)
            if first_sentence_match:
                project_model.title = first_sentence_match.group(1).strip()
            else:
                project_model.title = "Project from Proposal" # Fallback if no sentence ending is found # Updated
            # Overarching goals would require more advanced extraction or a dedicated LLM call
        else:
            print("⚠️ Could not parse project summary from raw string. Using full raw output as summary.")
            project_model.summary = raw_outputs["summary"] # Fallback to full raw output # Updated
            project_model.title = "Project from Proposal" # Updated

    # 2. Process Features (store as raw strings in a list for features)
    if "features" in raw_outputs:
        feature_lines = [line.strip() for line in raw_outputs["features"].splitlines() if line.strip().startswith("- ")]
        project_model.features = [re.sub(r"^\(Optional:\)\s*", "", line[2:].strip()) for line in feature_lines[:5]] # Updated

    # 3. Process Roles
    if "roles" in raw_outputs:
        team_members_list: List[TeamMemberModel] = []
        for line in raw_outputs["roles"].splitlines():
            if line.strip().startswith('- '):
                role_name = line.strip()[2:].strip()
                team_members_list.append(TeamMemberModel(role=role_name)) # Updated to only pass role
        project_model.roles = team_members_list # Updated
        if not project_model.roles:
            print("⚠️ No team members parsed from raw roles string.")

    # 4. Process Tasks (raw string) into tasks (List[str]) - NO SECONDARY LLM CALL HERE
    if "tasks" in raw_outputs:
        # Extract titles from the markdown list and store directly as strings
        task_titles = []
        for line in raw_outputs["tasks"].splitlines():
            title_match = re.match(r"^-\s*title:\s*(.*)", line.strip(), re.IGNORECASE)
            if title_match:
                task_titles.append(title_match.group(1).strip())
        project_model.tasks = task_titles # Updated
        if not project_model.tasks:
            print("⚠️ No initial Epics (tasks) parsed from raw tasks string.")

    # 5. Process Timeline (store as List[TimelineWeekModel])
    if "timeline" in raw_outputs:
        try:
            # Extract the YAML block starting from 'timeline:'
            timeline_yaml_match = re.search(r"timeline:\s*\n([\s\S]*)", raw_outputs["timeline"], re.DOTALL | re.IGNORECASE)
            if timeline_yaml_match:
                timeline_yaml_str = timeline_yaml_match.group(1).strip()
                
                # Manually parse the YAML-like structure
                parsed_timeline_weeks: List[TimelineWeekModel] = []
                current_week_number: Optional[int] = None
                current_week_tasks: List[TimelineTaskModel] = []
                
                for line in timeline_yaml_str.splitlines():
                    line = line.strip()
                    week_match = re.match(r"^-?\s*week_number:\s*(\d+)", line, re.IGNORECASE)
                    task_match = re.match(r"^-\s*(.*)", line)
                    
                    if week_match:
                        if current_week_number is not None:
                            parsed_timeline_weeks.append(TimelineWeekModel(week_number=current_week_number, tasks=current_week_tasks))
                        current_week_number = int(week_match.group(1))
                        current_week_tasks = []
                    elif task_match and current_week_number is not None:
                        task_title = task_match.group(1).strip()
                        current_week_tasks.append(TimelineTaskModel(title=task_title))
                
                if current_week_number is not None:
                    parsed_timeline_weeks.append(TimelineWeekModel(week_number=current_week_number, tasks=current_week_tasks))
                    
                project_model.timeline = parsed_timeline_weeks
                
            else:
                print("⚠️ Could not extract timeline YAML block.")
        except Exception as e:
            print(f"❌ Error parsing timeline: {e}")

    # Ensure epics is an empty list as it's populated by backlog_llm.py
    project_model.epics = []

    print("\n--- Initial Project Data Structuring Completed ---")
    return project_model

if __name__ == "__main__":
    final_project_plan = run_pipeline()
    print("\n--- Final Project Model (JSON) ---")
    json_output = final_project_plan.model_dump_json(indent=2, exclude_defaults=True)
    print(json_output)

    # Save to project_management.jsonl
    output_file = "datasets/project_management.jsonl"
    with open(output_file, "a", encoding="utf-8") as f:
        # Ensure it's a single line JSON for JSONL format
        f.write(final_project_plan.model_dump_json(exclude_defaults=True) + "\n")
    print(f"\n✅ Project data saved to {output_file}")