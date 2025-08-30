import os
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, BitsAndBytesConfig
from langchain_huggingface import HuggingFacePipeline
import torch
from utils.pdf_parser import extract_text_from_pdf

# Model ID
MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2"

# Token limits per section
TOKEN_LIMITS = {
    "summary": 128,
    "tasks": 192,
    "roles": 224,
    "timeline": 192,
    "risks": 224
}

# Load quantized Mistral model once
def load_llm(model_id: str) -> HuggingFacePipeline:
    print(f"🔧 Loading model: {model_id}")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)

    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4"
    )

    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=quant_config,
        device_map="auto",
        torch_dtype=torch.float16,
        trust_remote_code=True
    )

    print("✅ Mistral loaded and ready.")
    return HuggingFacePipeline(pipeline=pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        temperature=0.7,
        do_sample=True,
        return_full_text=False
    ))

# Build prompt from section-specific prompt file
def build_prompt(section: str, proposal: str) -> str:
    root_dir = os.path.dirname(os.path.dirname(__file__))
    prompt_path = os.path.join(root_dir, "LLMs", "prompts", f"{section}_prompt.txt")

    if not os.path.exists(prompt_path):
        print(f"⚠️ Prompt file not found for section: {section}")
        return ""

    with open(prompt_path, "r", encoding="utf-8") as f:
        template = f.read().strip()

    prompt = template.replace("{proposal}", proposal)
    print(f"🧠 Prompt built for section: {section}")
    return prompt

# Run all sections sequentially
def run_all_sections(proposal_path: str = "datasets/project_proposal3.pdf"):
    proposal = extract_text_from_pdf(proposal_path)

    if not proposal.strip():
        print("⚠️ Proposal text is empty or unreadable. Check the PDF parser or file path.")
        return
    else:
        print("📄 Proposal loaded successfully.")

    llm = load_llm(MODEL_ID)
    sections = ["summary", "tasks", "roles", "timeline", "risks"]

    for section in sections:
        print(f"\n🚀 Generating section: {section.upper()}")
        prompt = build_prompt(section, proposal)
        if not prompt:
            continue

        llm.pipeline.max_new_tokens = TOKEN_LIMITS[section]
        response = llm.invoke(prompt)

        # Guardrails for broken or placeholder output
        if not response.strip():
            print(f"⚠️ Empty response for section: {section}")
        elif section != "summary" and len(response.strip().splitlines()) < 3:
            print(f"⚠️ Incomplete or truncated response for section: {section}")
        elif any(tag in response.lower() for tag in ["assistant:", "question:", "answer:", "output:", "[brief", "[task", "[risk"]):
            print(f"⚠️ Model drifted or returned placeholders in section: {section}")

        print(f"\n--- {section.upper()} ---\n{response.strip()}\n")

if __name__ == "__main__":
    run_all_sections()