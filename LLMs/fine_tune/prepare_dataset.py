from datasets import load_dataset
from transformers import AutoTokenizer

#Models
MODELS = {
    "phi": "microsoft/phi-2",
    "tinyllama": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    "qwen": "Qwen/Qwen2-0.5B-Instruct"
}

#Load dataset
dataset = load_dataset("ai-in-projectmanagement/ProjectManagementLLM_dataset")

#Format prompt-response pairs
def format_example(entry):
    prompt = (
        f"Task: {entry['task']}\n"
        f"Description: {entry['description']}\n"
        f"Cost Variance: {entry['cost_variance']}\n"
        f"Schedule Variance: {entry['schedule_variance']}\n"
        f"Suggest a recovery plan."
    )
    return {"prompt": prompt, "response": entry["recommendation"]}

formatted_dataset = dataset["train"].map(format_example)

#Tokenize for each model
for name, model_id in MODELS.items():
    print(f"\n Tokenizing for {name.upper()}...")

    tokenizer = AutoTokenizer.from_pretrained(model_id)

    def tokenize(example):
        return tokenizer(
            example["prompt"],
            text_target=example["response"],
            truncation=True,
            padding="max_length",
            max_length=512
        )

    tokenized = formatted_dataset.map(tokenize, batched=True)

    #Save to disk
    save_path = f"datasets/tokenized_project_management_{name}"
    tokenized.save_to_disk(save_path)
    print(f"Saved tokenized dataset to: {save_path}")