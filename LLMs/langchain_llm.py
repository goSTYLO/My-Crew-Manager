import os
import time
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
from utils.pdf_parser import extract_text_from_pdf
from parser import (
    parse_summary,
    parse_roles,
    parse_tasks,
    parse_timeline,
    parse_risks
)

MODEL_ID = "unsloth/mistral-7b-instruct-v0.3-bnb-4bit"

TOKEN_LIMITS = {
    "summary": 128,
    "roles": 192,
    "tasks": 192,
    "timeline": 192,
    "risks": 224
}

def load_llm(model_id: str) -> HuggingFacePipeline:
    print(f"🔧 Loading pre-quantized model: {model_id}")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        device_map="auto",
        torch_dtype="auto",
        trust_remote_code=True
    )
    print("✅ Pre-quantized Mistral loaded and ready.")
    return HuggingFacePipeline(pipeline=pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        temperature=0.7,
        do_sample=True,
        return_full_text=False
    ))

def build_prompt(section: str, proposal: str, context: dict = None) -> str:
    root_dir = os.path.dirname(os.path.dirname(__file__))
    prompt_path = os.path.join(root_dir, "LLMs", "prompts", f"{section}_prompt.txt")

    if not os.path.exists(prompt_path):
        print(f"⚠️ Prompt file not found for section: {section}")
        return ""

    with open(prompt_path, "r", encoding="utf-8") as f:
        template = f.read().strip()

    prompt = template.replace("{proposal}", proposal)
    if context:
        for key, value in context.items():
            prompt = prompt.replace(f"{{{key}}}", value.strip())

    print(f"🧠 Prompt built for section: {section}")
    return prompt

def validate_structure(section: str, response: str) -> bool:
    if not response.strip():
        return False
    if section == "timeline":
        return response.strip().startswith("timeline:") and "<task title>" not in response and response.count("timeline:") == 1
    if section == "risks":
        if not response.strip().startswith("risks:"):
            return False
        if "<risk type>" in response or response.count("risks:") > 1:
            return False
        return True
    return True

def run_all_sections(proposal_path: str = "datasets/project_proposal2.pdf"):
    proposal = extract_text_from_pdf(proposal_path)

    if not proposal.strip():
        print("⚠️ Proposal text is empty or unreadable. Check the PDF parser or file path.")
        return
    else:
        print("📄 Proposal loaded successfully.")

    llm = load_llm(MODEL_ID)
    raw_outputs = {}
    parsed_outputs = {}
    sections = ["summary", "roles", "tasks", "timeline", "risks"]

    for section in sections:
        print(f"\n🚀 Generating section: {section.upper()}")

        context = {}
        if section == "tasks":
            context["roles"] = raw_outputs.get("roles", "")
        elif section == "timeline":
            context["tasks"] = raw_outputs.get("tasks", "")
        elif section == "risks":
            context["summary"] = raw_outputs.get("summary", "")
            context["roles"] = raw_outputs.get("roles", "")
            context["tasks"] = raw_outputs.get("tasks", "")

        prompt = build_prompt(section, proposal, context)
        if not prompt:
            continue

        llm.pipeline.max_new_tokens = TOKEN_LIMITS[section]

        start_time = time.time()
        response = llm.invoke(prompt)
        duration = time.time() - start_time
        print(f"⏱️ Generation time for {section.upper()}: {duration:.2f} seconds")

        response_text = response.strip()

        if not response_text:
            print(f"⚠️ Empty response for section: {section}")
        elif section in ["timeline", "risks"] and not validate_structure(section, response_text):
            print(f"⚠️ Invalid structure detected in section: {section}")
        elif section != "summary" and len(response_text.splitlines()) < 3:
            print(f"⚠️ Incomplete or truncated response for section: {section}")
        elif any(tag in response_text.lower() for tag in ["assistant:", "question:", "answer:", "output:"]):
            print(f"⚠️ Model drifted or returned assistant-style commentary in section: {section}")

        raw_outputs[section] = response_text
        print(f"\n--- RAW {section.upper()} ---\n{response_text}\n")

        if section == "summary":
            parsed_outputs["summary"] = parse_summary(response_text)
            print(f"--- PARSED {section.upper()} ---")
            print(json.dumps({"summary": parsed_outputs["summary"]}, indent=2, ensure_ascii=False))
        elif section == "roles":
            parsed_outputs["roles"] = parse_roles(response_text)
            print(f"--- PARSED {section.upper()} ---")
            print(json.dumps(parsed_outputs["roles"], indent=2, ensure_ascii=False))
        elif section == "tasks":
            parsed_outputs["tasks"] = parse_tasks(response_text)
            print(f"--- PARSED {section.upper()} ---")
            print(json.dumps(parsed_outputs["tasks"], indent=2, ensure_ascii=False))
        elif section == "timeline":
            parsed_outputs["timeline"] = parse_timeline(response_text)
            print(f"--- PARSED {section.upper()} ---")
            print(json.dumps(parsed_outputs["timeline"], indent=2, ensure_ascii=False))
        elif section == "risks":
            parsed_outputs["risks"] = parse_risks(response_text)
            print(f"--- PARSED {section.upper()} ---")
            print(json.dumps(parsed_outputs["risks"], indent=2, ensure_ascii=False))

if __name__ == "__main__":
    run_all_sections()