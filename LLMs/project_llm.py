import os
import re
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
from .models import (
    ProjectModel,
    TeamMemberModel,
    TimelineWeekModel,
    TimelineTaskModel
)
from typing import Dict

MODEL_ID = "unsloth/mistral-7b-instruct-v0.3-bnb-4bit"

def load_llm() -> HuggingFacePipeline:
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
        max_new_tokens=2048,
        temperature=0.7,
        do_sample=True,
        return_full_text=False
    )
    print("✅ Model loaded and ready")
    return HuggingFacePipeline(pipeline=pipe)

def build_prompt(section: str, proposal_text: str, context: Dict = None) -> str:
    root_dir = os.path.dirname(__file__)
    prompt_path = os.path.join(root_dir, "prompts", f"{section}_prompt.txt")

    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            template = f.read().strip()
    except Exception as e:
        print(f"⚠️ Failed to load prompt: {e}")
        return ""

    prompt = template.replace("{proposal_text}", proposal_text)
    if context:
        for key, value in context.items():
            prompt = prompt.replace(f"{{{key}}}", str(value).strip())

    prompt = re.sub(r"{\w+}", "", prompt)
    print(f"🧠 Built prompt for: {section}")
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
    if section == "timeline":
        return "timeline:" in response_lower and "week_number:" in response_lower
    return True

def generate_section(llm, section: str, prompt: str, max_retries: int = 5) -> str:
    for attempt in range(max_retries):
        print(f"  Attempt {attempt + 1} for {section}...")
        try:
            response = llm.invoke(prompt).strip()
            if not response:
                print(f"⚠️ Empty response for {section}")
                continue
            if not validate_section_format(section, response):
                print(f"⚠️ Invalid format for {section}")
                continue
            print(f"\n--- RAW {section.upper()} ---\n{response}\n")
            return response
        except Exception as e:
            print(f"❌ Error generating {section}: {e}")
    print(f"❌ Failed to generate {section} after {max_retries} attempts.")
    return ""

def run_pipeline_from_text(proposal_text: str) -> ProjectModel:
    if not proposal_text:
        print("⚠️ Empty proposal text")
        return ProjectModel()

    llm = load_llm()
    project_model = ProjectModel()
    raw_outputs = {}
    sections = ["summary", "features", "roles", "timeline"]

    for section in sections:
        print(f"\n🚀 Generating: {section.upper()}")

        context = {
            "proposal_text": proposal_text,
            "project_title": project_model.title or "",
            "project_summary": project_model.summary or "",
            "overarching_goals": ", ".join(project_model.features),
            "additional_roles": "\n".join([r.role for r in project_model.roles]) if project_model.roles else "",
            "tasks": ""
        }

        prompt = build_prompt(section, proposal_text, context)
        if prompt:
            raw_response = generate_section(llm, section, prompt)
            if raw_response:
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

    if "timeline" in raw_outputs:
        try:
            match = re.search(r"timeline:\s*\n([\s\S]*)", raw_outputs["timeline"], re.DOTALL | re.IGNORECASE)
            if match:
                timeline_str = match.group(1).strip()
                weeks = []
                current_week = None
                current_tasks = []
                for line in timeline_str.splitlines():
                    line = line.strip()
                    week_match = re.match(r"^-?\s*week_number:\s*(\d+)", line, re.IGNORECASE)
                    task_match = re.match(r"^-\s*(.*)", line)
                    if week_match:
                        if current_week is not None:
                            weeks.append(TimelineWeekModel(week_number=current_week, tasks=current_tasks))
                        current_week = int(week_match.group(1))
                        current_tasks = []
                    elif task_match and current_week is not None:
                        current_tasks.append(TimelineTaskModel(title=task_match.group(1).strip()))
                if current_week is not None:
                    weeks.append(TimelineWeekModel(week_number=current_week, tasks=current_tasks))
                project_model.timeline = weeks
        except Exception as e:
            print(f"❌ Error parsing timeline: {e}")

    print("\n--- Project Overview + Timeline Completed ---")
    return project_model

def model_to_dict(project_model: ProjectModel) -> dict:
    return {
        "title": project_model.title,
        "summary": project_model.summary,
        "features": project_model.features,
        "roles": [r.role for r in project_model.roles],
        "timeline": [
            {
                "week_number": week.week_number,
                "tasks": [task.title for task in week.tasks]
            }
            for week in project_model.timeline
        ]
    }