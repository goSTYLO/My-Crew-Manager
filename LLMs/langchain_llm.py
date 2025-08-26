from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
import torch
import time
from utils.pdf_parser import extract_text_from_pdf  # PDFPlumber integration

# Model IDs
MODELS = {
    "phi": "microsoft/phi-2",
    "tinyllama": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    "qwen": "Qwen/Qwen2-0.5B-Instruct"
}

# Base prompt template
BASE_PROMPT = """You are a senior AI project assistant supporting a project manager and their team in executing and managing a technical project. You will be provided with a full project proposal.

Your responsibilities include:
- Interpreting the project’s goals, timeline, resources, roles, and risks
- Recommending planning strategies, task breakdowns, and realistic timelines
- Assigning roles and responsibilities based on team strengths and project needs
- Monitoring progress and suggesting adjustments as needed
- Communicating clearly and constructively to support team collaboration
- Identifying and warning about risks, delays, or ambiguities in the proposal

Please analyze the following proposal and respond with actionable insights, structured recommendations, and any concerns or clarifications needed.
"""

# Loader Function
def load_llm(model_id: str) -> HuggingFacePipeline:
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        device_map=None
    ).to("cuda")

    text_gen = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        max_new_tokens=128,
        do_sample=True
    )

    return HuggingFacePipeline(pipeline=text_gen)

# Load All Models
llms = {
    "phi": load_llm(MODELS["phi"]),
    "tinyllama": load_llm(MODELS["tinyllama"]),
    "qwen": load_llm(MODELS["qwen"])
}

# Load proposal from PDF
PROPOSAL = extract_text_from_pdf("datasets/project_proposal.pdf")

# Section-specific prompt builder
def build_prompt(section: str, proposal: str) -> str:
    return f"{BASE_PROMPT}\n\nFocus on: {section}\n\nProposal:\n{proposal}"

# Routing logic
ROUTER = {
    "summary": lambda proposal: llms["phi"].invoke(build_prompt("Project Summary", proposal)),
    "tasks": lambda proposal: llms["phi"].invoke(build_prompt("Task Breakdown & Timeline", proposal)),
    "roles": lambda proposal: llms["qwen"].invoke(build_prompt("Role & Responsibility Assignment", proposal)),
    "risks": lambda proposal: llms["phi"].invoke(build_prompt("Risk & Issue Analysis", proposal)),
    "communication": lambda proposal: llms["tinyllama"].invoke(build_prompt("Communication & Onboarding Guidance", proposal)),
    "monitoring": lambda proposal: llms["qwen"].invoke(build_prompt("Progress Monitoring Suggestions", proposal))
}

# Execute routing
if __name__ == "__main__":
    combined_output = []

    for section, handler in ROUTER.items():
        print(f"\n{section.upper()} Response:\n")

        start_time = time.time()
        response = handler(PROPOSAL)
        end_time = time.time()

        duration = end_time - start_time
        print(response)
        print(f"Response time for {section.upper()}: {duration:.2f} seconds")

        combined_output.append(f"{section.upper()}:\n{response}\n")

    print("\nCOMBINED RESPONSE:\n")
    print("\n".join(combined_output))