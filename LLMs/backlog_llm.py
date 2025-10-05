import os
import re
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
from LLMs.models import (
    ProjectModel,
    BacklogModel,
    EpicModel,
    SubEpicModel,
    UserStoryModel,
    TaskModel
)

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

def parse_structured_backlog(raw_text: str) -> BacklogModel:
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
            current_sub_epic = None
            current_user_story = None

        elif line.startswith("-Sub-Epic") and current_epic:
            label, content = line.split(":", 1)
            title = f"{label.strip()}: {content.strip()}"
            current_sub_epic = SubEpicModel(title=title, ai=True)
            current_epic.sub_epics.append(current_sub_epic)
            current_user_story = None

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
                status="Todo",
                ai=True
            )
            current_user_story.tasks.append(task)

    return backlog

def serialize_backlog_to_json(backlog: BacklogModel) -> str:
    return json.dumps(
        [epic.model_dump(exclude_defaults=True) for epic in backlog.epics],
        indent=2,
        ensure_ascii=False
    )

def run_backlog_pipeline(proposal_text: str, project_model: ProjectModel) -> BacklogModel:
    print("\n--- Starting Backlog Generation ---")
    llm = load_llm()

    if not project_model.title or not project_model.summary or not project_model.goals:
        print("⚠️ Missing required fields in ProjectModel. Skipping backlog generation.")
        return BacklogModel()

    context = {
        "project_title": project_model.title,
        "features": ", ".join(project_model.features),
        "tasks": "\n".join(project_model.goals)
    }


    prompt = build_prompt("backlog", proposal_text, context)
    raw_backlog = generate_section(llm, "backlog", prompt)

    if raw_backlog:
        backlog = parse_structured_backlog(raw_backlog)
        json_backlog = serialize_backlog_to_json(backlog)
        print("\n📦 Parsed Backlog JSON:\n", json_backlog)

        try:
            os.makedirs("outputs", exist_ok=True)
            with open("outputs/backlog.json", "w", encoding="utf-8") as f:
                f.write(json_backlog)
        except Exception as e:
            print(f"⚠️ Failed to save JSON file: {e}")

        print("\n✅ Backlog generation complete.")
        return backlog

    print("❌ No backlog generated.")
    return BacklogModel()