"""
Prepare dataset for project LLM fine-tuning.
Reads JSONL from dataset/ (summary, features, roles, goals, timeline, backlog),
combines into one dataset, and tokenizes for causal LM with LoRA training.
"""
import json
from pathlib import Path

from datasets import Dataset, concatenate_datasets
from transformers import AutoTokenizer

# Supported models (same as train_lora)
MODELS = {
    "phi": "microsoft/phi-2",
    "tinyllama": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    "qwen": "Qwen/Qwen2-0.5B-Instruct",
}

# Dataset directory (relative to this file)
DATASET_DIR = Path(__file__).resolve().parent / "dataset"
SECTIONS = ["summary", "features", "roles", "goals", "timeline", "backlog"]


def load_jsonl_section(section: str) -> list[dict]:
    """Load prompt/response pairs from a section's JSONL file."""
    path = DATASET_DIR / f"{section}.jsonl"
    if not path.exists():
        return []
    examples = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                examples.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return examples


def load_all_sections() -> list[dict]:
    """Load and combine all section JSONL files into one list of examples."""
    all_examples = []
    for section in SECTIONS:
        examples = load_jsonl_section(section)
        all_examples.extend(examples)
    return all_examples


def tokenize_for_causal_lm(example: dict, tokenizer: AutoTokenizer, max_length: int = 512) -> dict:
    """
    Tokenize prompt+response for causal LM. Labels are -100 for prompt tokens
    (no loss) and actual token ids for response tokens.
    """
    prompt = example["prompt"]
    response = example["response"]
    full_text = prompt + "\n" + response

    # Tokenize full sequence
    tokenized = tokenizer(
        full_text,
        truncation=True,
        max_length=max_length,
        padding="max_length",
        return_tensors=None,
    )

    # Get prompt length (tokenize prompt + newline to match boundary)
    prompt_part = prompt + "\n"
    prompt_encoded = tokenizer(
        prompt_part,
        add_special_tokens=False,
        truncation=True,
        max_length=max_length,
    )
    prompt_len = len(prompt_encoded["input_ids"])

    # Labels: -100 for prompt, actual ids for response, -100 for padding
    pad_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else 0
    labels = []
    for i, tid in enumerate(tokenized["input_ids"]):
        if i < prompt_len:
            labels.append(-100)
        elif tid == pad_id:
            labels.append(-100)
        else:
            labels.append(tid)

    tokenized["labels"] = labels
    return tokenized


def prepare_tokenized_dataset(
    model_name: str = "qwen",
    max_length: int = 512,
    output_dir: str | None = None,
) -> Dataset:
    """
    Load JSONL, tokenize for the given model, and optionally save to disk.
    """
    model_id = MODELS.get(model_name, MODELS["qwen"])
    examples = load_all_sections()

    if not examples:
        raise FileNotFoundError(
            f"No examples found in {DATASET_DIR}. Add JSONL files: "
            f"{', '.join(f'{s}.jsonl' for s in SECTIONS)}"
        )

    dataset = Dataset.from_list(examples)
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)

    def tokenize_fn(example):
        return tokenize_for_causal_lm(example, tokenizer, max_length)

    tokenized = dataset.map(
        tokenize_fn,
        remove_columns=dataset.column_names,
        desc="Tokenizing",
    )

    if output_dir:
        save_path = Path(output_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        tokenized.save_to_disk(str(save_path))
        print(f"Saved tokenized dataset to {save_path}")

    return tokenized


def main():
    """Run for each model and save tokenized datasets."""
    tokenized_dir = DATASET_DIR.parent / "tokenized"
    for name in MODELS:
        print(f"\nTokenizing for {name.upper()}...")
        output_path = tokenized_dir / f"tokenized_project_management_{name}"
        prepare_tokenized_dataset(
            model_name=name,
            max_length=512,
            output_dir=str(output_path),
        )


if __name__ == "__main__":
    main()
