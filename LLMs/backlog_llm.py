import os
import re
from typing import Dict
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
try:
    from transformers import BitsAndBytesConfig
except Exception:
    BitsAndBytesConfig = None
from LLMs.models import BacklogModel, EpicModel, SubEpicModel, UserStoryModel, TaskModel

MODEL_ID = "unsloth/mistral-7b-instruct-v0.3-bnb-4bit"

def load_llm() -> HuggingFacePipeline:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)

    use_cuda = torch.cuda.is_available()
    quant_cfg = None
    if use_cuda and BitsAndBytesConfig is not None:
        quant_cfg = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
        )

    if use_cuda:
        if quant_cfg is not None:
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                device_map="auto",
                torch_dtype=torch.float16,
                trust_remote_code=True,
                quantization_config=quant_cfg,
            )
        else:
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                device_map=None,
                torch_dtype=torch.float16,
                trust_remote_code=True,
            ).to("cuda")
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=1024,
            temperature=0.7,
            do_sample=True,
            return_full_text=False,
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            device_map=None,
            torch_dtype=torch.float32,
            trust_remote_code=True,
        )
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            return_full_text=False,
        )
    return HuggingFacePipeline(pipeline=pipe)

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

def generate_section(llm, section: str, prompt: str, max_retries: int = 3) -> str:
    for _ in range(max_retries):
        try:
            response = llm.invoke(prompt).strip()
            if response:
                return response
        except Exception:
            continue
    return ""

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

def run_backlog_pipeline(proposal_text: str, context: Dict) -> BacklogModel:
    if not proposal_text:
        return BacklogModel()

    llm = load_llm()
    prompt = build_prompt("backlog", proposal_text, context)
    if not prompt:
        return BacklogModel()

    raw_backlog = generate_section(llm, "backlog", prompt)
    if not raw_backlog:
        return BacklogModel()

    print(f"\n--- RAW BACKLOG ---\n{raw_backlog}\n")
    return parse_backlog(raw_backlog)