from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
import torch
import time

# Model IDs
MODELS = {
    "phi": "microsoft/phi-2",
    "tinyllama": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    "qwen": "Qwen/Qwen2-0.5B-Instruct"
}

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

# Test Prompts
TEST_PROMPTS = {
    "phi": "List 3 tasks for setting up a Django backend.",
    "tinyllama": "explain this: Django is a Python web framework.",
    "qwen": "Estimate how long it takes to build a basic API with Django."
}

# Combine Responses
if __name__ == "__main__":
    combined_output = []

    for name, llm in llms.items():
        print(f"\n{name.upper()} Response:\n")

        start_time = time.time()
        response = llm.invoke(TEST_PROMPTS[name])
        end_time = time.time()

        duration = end_time - start_time
        print(response)
        print(f"Response time for {name.upper()}: {duration:.2f} seconds")

        combined_output.append(f"{name.upper()}:\n{response}\n")

    print("\nCOMBINED RESPONSE:\n")
    print("\n".join(combined_output))