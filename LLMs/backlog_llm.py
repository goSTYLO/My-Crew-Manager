import os
import re
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
from .utils.pdf_parser import extract_text_from_pdf
from LLMs.models import ProjectModel, EpicModel, SubEpicModel, UserStoryModel, TaskModel
from typing import Optional

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

def build_prompt(section: str, proposal_text: str, context: dict = None) -> str:
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

def generate_section(llm, section: str, prompt: str) -> str:
    print(f"🚀 Generating: {section.upper()}")
    try:
        response = llm.invoke(prompt).strip()
        print(f"\n--- RAW {section.upper()} ---\n{response}\n")
        return response
    except Exception as e:
        print(f"❌ Error generating {section}: {e}")
        return ""

def parse_structured_backlog(raw_text: str) -> list:
    epics = []
    current_epic = None
    current_sub_epic = None
    current_user_story = None

    for line in raw_text.splitlines():
        line = line.strip()

        # Epic
        if line.startswith("Epic"):
            label, content = line.split(":", 1)
            title = f"{label.strip()}: {content.strip()}"
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
            epics.append(current_epic)
            current_sub_epic = None
            current_user_story = None

        # Sub-Epic
        elif line.startswith("-Sub-Epic"):
            if current_epic:
                label, content = line.split(":", 1)
                title = f"{label.strip()}: {content.strip()}"
                current_sub_epic = SubEpicModel(title=title, ai=True)
                current_epic.sub_epics.append(current_sub_epic)
                current_user_story = None

        # User Story
        elif line.startswith("-User Story"):
            if current_sub_epic:
                label, content = line.split(":", 1)
                title = f"{label.strip()}: {content.strip()}"
                current_user_story = UserStoryModel(title=title, ai=True)
                current_sub_epic.user_stories.append(current_user_story)

        # Task
        elif line.startswith("-Task"):
            if current_user_story:
                label, content = line.split(":", 1)
                title = f"{label.strip()}: {content.strip()}"
                task = TaskModel(
                    title=title,
                    description="",
                    status="Todo",
                    ai=True
                )
                current_user_story.tasks.append(task)

    return epics

def serialize_backlog_to_json(epics: list) -> str:
    return json.dumps(
        [epic.model_dump(exclude_defaults=True) for epic in epics],
        indent=2,
        ensure_ascii=False
    )

def run_backlog_pipeline(llm, proposal_text: str, project_model: ProjectModel) -> ProjectModel:
    print("\n--- Starting Backlog Generation ---")

    if not project_model.title or not project_model.summary or not project_model.tasks:
        print("⚠️ Missing required fields in ProjectModel. Skipping backlog generation.")
        return project_model

    context = {
        "project_title": project_model.title,
        "project_summary": project_model.summary,
        "tasks": "\n".join(project_model.tasks)
    }

    prompt = build_prompt("backlog", proposal_text, context)
    raw_backlog = generate_section(llm, "backlog", prompt)

    if raw_backlog:
        project_model.epics = parse_structured_backlog(raw_backlog)
        json_backlog = serialize_backlog_to_json(project_model.epics)
        print("\n📦 Parsed Backlog JSON:\n", json_backlog)

        # Optional: Save to file
        try:
            os.makedirs("outputs", exist_ok=True)
            with open("outputs/backlog.json", "w", encoding="utf-8") as f:
                f.write(json_backlog)
        except Exception as e:
            print(f"⚠️ Failed to save JSON file: {e}")

    print("\n✅ Backlog generation complete.")
    return project_model

if __name__ == "__main__":
    print("Running backlog_llm.py directly...")
    llm_instance = load_llm()

    try:
        with open("datasets/project_management.jsonl", "r", encoding="utf-8") as f:
            full_content = f.read()
            project_model_from_file = ProjectModel.model_validate_json(full_content)
    except Exception as e:
        print(f"❌ Failed to load ProjectModel: {e}")
        exit()

    proposal_text = extract_text_from_pdf("datasets/project_proposal3.pdf")
    if not proposal_text:
        print("❌ Failed to extract proposal text.")
        exit()

    final_project_plan = run_backlog_pipeline(llm_instance, proposal_text, project_model_from_file)