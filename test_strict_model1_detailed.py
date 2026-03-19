"""
Detailed analysis of Model 1 strict training outputs.
"""

import sys
import json
import re
from pathlib import Path
from copy import deepcopy

sys.path.insert(0, str(Path('AI')))

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

MODEL_ID = 'Qwen/Qwen2-1.5B-Instruct'
OUTPUT_DIR = Path('AI/llms/fine_tune/qwen_model1_overview_lora_1p5b')
DATASET_DIR = Path('AI/llms/fine_tune/dataset')

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(MODEL_ID, dtype=torch.float16, trust_remote_code=True)
model_infer = PeftModel.from_pretrained(base_model, str(OUTPUT_DIR))
if torch.cuda.is_available():
    model_infer = model_infer.to('cuda')

STRICT_SYSTEM_PROMPT = """You are a project proposal analyzer. Your task is to transform raw project descriptions into structured, plain-text project overviews.

CRITICAL CONSTRAINTS (non-negotiable):
1. Output EXACTLY these 6 sections in this exact order: Title, Summary, Roles, Features, Goals, Timeline
2. FORBIDDEN SECTIONS - Never output: Status, Proposal/Input, Backlog, or any other sections
3. Timeline MUST contain exactly 4 weeks: Week 1, Week 2, Week 3, Week 4
4. Each week MUST list exactly 2 tasks (no more, no less)"""

# Load first example
dataset_file = DATASET_DIR / 'model1_description_to_part1.jsonl'
with open(dataset_file, 'r', encoding='utf-8') as f:
    example = json.loads(f.readline().strip())

proposal = example['prompt']
test_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nProposal / Input:\n{proposal}"

print("=" * 80)
print("EXAMPLE 1 - FULL ANALYSIS")
print("=" * 80)

inputs = tokenizer(test_prompt, return_tensors='pt')
if torch.cuda.is_available():
    inputs = {k: v.cuda() for k, v in inputs.items()}

gen_cfg = deepcopy(model_infer.generation_config)
gen_cfg.do_sample = False
gen_cfg.temperature = None
gen_cfg.top_p = None
gen_cfg.top_k = None

outputs = model_infer.generate(
    **inputs, generation_config=gen_cfg, max_new_tokens=512,
    pad_token_id=tokenizer.eos_token_id, eos_token_id=tokenizer.eos_token_id,
    repetition_penalty=1.05, no_repeat_ngram_size=3,
)
generated = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True).strip()

# Save full response
with open('model1_output_example.txt', 'w', encoding='utf-8') as f:
    f.write(generated)

print("\nFULL GENERATED OUTPUT:")
print("=" * 80)
print(generated)
print("=" * 80)

# Detailed checks
print("\nDETAILED ANALYSIS:")

# Check for forbidden sections
status_found = bool(re.search(r'^Status\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))
proposal_found = bool(re.search(r'^Proposal\s*/\s*Input\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))
backlog_found = bool(re.search(r'^Backlog\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))

print(f"Status found: {status_found} (should be False)")
print(f"Proposal/Input found: {proposal_found} (should be False)")
print(f"Backlog found: {backlog_found} (should be False)")

# Check sections
title_found = bool(re.search(r'^Title\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))
summary_found = bool(re.search(r'^Summary\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))
roles_found = bool(re.search(r'^Roles\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))
features_found = bool(re.search(r'^Features\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))
goals_found = bool(re.search(r'^Goals\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))
timeline_found = bool(re.search(r'^Timeline\s*:', generated, flags=re.MULTILINE | re.IGNORECASE))

print(f"\nRequired sections:")
print(f"  Title: {title_found}")
print(f"  Summary: {summary_found}")
print(f"  Roles: {roles_found}")
print(f"  Features: {features_found}")
print(f"  Goals: {goals_found}")
print(f"  Timeline: {timeline_found}")

# Check timeline weeks
weeks = re.findall(r'^Week\s+[1-4]\s*:\s*(.+)$', generated, flags=re.MULTILINE | re.IGNORECASE)
print(f"\nTimeline weeks found: {len(weeks)}/4")
for i, week_content in enumerate(weeks, start=1):
    print(f"  Week {i}: {week_content[:60]}...")

# Expected response
print(f"\nEXPECTED OUTPUT FROM DATASET (first 400 chars):")
print("=" * 80)
print(example['response'][:400])
print("=" * 80)

print(f"\nOutput saved to: model1_output_example.txt")
