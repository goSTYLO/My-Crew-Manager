from datasets import load_from_disk
from transformers import AutoModelForCausalLM, TrainingArguments, Trainer, AutoTokenizer
from peft import get_peft_model, LoraConfig, TaskType

# Supported models and their tokenized dataset paths
MODELS = {
    "phi": {
        "model_id": "microsoft/phi-2",
        "dataset_path": "datasets/tokenized_project_management_phi"
    },
    "tinyllama": {
        "model_id": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "dataset_path": "datasets/tokenized_project_management_tinyllama"
    },
    "qwen": {
        "model_id": "Qwen/Qwen2-0.5B-Instruct",
        "dataset_path": "datasets/tokenized_project_management_qwen"
    }
}

# LoRA configuration
peft_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=32,
    lora_dropout=0.1,
    bias="none"
)

# Training arguments
training_args = TrainingArguments(
    output_dir="./results",
    per_device_train_batch_size=4,
    num_train_epochs=3,
    logging_dir="./logs",
    save_steps=100,
    evaluation_strategy="no",
    fp16=True
)

# Loop through each model and fine-tune
for name, config in MODELS.items():
    print(f"\nStarting LoRA fine-tuning for {name.upper()}")

    # Load tokenized dataset
    dataset = load_from_disk(config["dataset_path"])

    # Load base model and tokenizer
    tokenizer = AutoTokenizer.from_pretrained(config["model_id"])
    model = AutoModelForCausalLM.from_pretrained(config["model_id"], torch_dtype="auto")

    # Apply LoRA adapters
    model = get_peft_model(model, peft_config)

    # Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        tokenizer=tokenizer
    )

    # Train
    trainer.train()

    # Save fine-tuned model
    save_path = f"LLMs/fine_tune/{name}_project_manager_lora"
    trainer.save_model(save_path)
    print(f"Saved fine-tuned {name.upper()} model to {save_path}")