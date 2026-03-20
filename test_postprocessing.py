import sys, json, re
from pathlib import Path
from copy import deepcopy
sys.path.insert(0, str(Path('AI')))
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

MODEL_ID = 'Qwen/Qwen2-1.5B-Instruct'
OUTPUT_DIR = Path('AI/llms/fine_tune/qwen_model1_overview_lora_1p5b')
DATASET_DIR = Path('AI/llms/fine_tune/dataset')

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(MODEL_ID, dtype=torch.float16, trust_remote_code=True)
model_infer = PeftModel.from_pretrained(base_model, str(OUTPUT_DIR))
if torch.cuda.is_available():
    model_infer = model_infer.to('cuda')

prompt_template = """Proposal / Input:
{}

Output structured project overview with exactly these sections:
1. Title
2. Summary
3. Roles
4. Features
5. Goals
6. Timeline (Week 1-4)"""

def sanitize_response(response):
    """Remove forbidden sections."""
    lines = response.split('\n')
    cleaned = []
    skip = False
    for line in lines:
        if re.match(r'^\s*(Status|Backlog|Proposal|Input)', line, re.IGNORECASE):
            skip = True
            continue
        if re.match(r'^\s*(Title|Summary|Roles|Features|Goals|Timeline)', line, re.IGNORECASE):
            skip = False
        if not skip:
            cleaned.append(line)
    return '\n'.join(cleaned).strip()

print("\nLoading dataset...")
with open(DATASET_DIR / 'model1_description_to_part1.jsonl') as f:
    ex1 = json.loads(f.readline().strip())
    ex2 = json.loads(f.readline().strip())

results = []

for idx, example in enumerate([ex1, ex2], 1):
    print(f"\n--- EXAMPLE {idx} ---")
    test_prompt = prompt_template.format(example['prompt'])
    
    inputs = tokenizer(test_prompt, return_tensors='pt')
    if torch.cuda.is_available():
        inputs = {k: v.cuda() for k, v in inputs.items()}
    
    gen_cfg = deepcopy(model_infer.generation_config).__dict__
    gen_cfg.pop('_from_model_config', None)
    
    outputs = model_infer.generate(**inputs, max_new_tokens=512, pad_token_id=tokenizer.eos_token_id, eos_token_id=tokenizer.eos_token_id, repetition_penalty=1.05, no_repeat_ngram_size=3, do_sample=False)
    raw = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True).strip()
    
    fixed = sanitize_response(raw)
    
    # Check compliance
    raw_weeks = len(set(re.findall(r'Week\s+[1-4]', raw, re.IGNORECASE)))
    fixed_weeks = len(set(re.findall(r'Week\s+[1-4]', fixed, re.IGNORECASE)))
    raw_status = bool(re.search(r'\bStatus\b', raw))
    fixed_status = bool(re.search(r'\bStatus\b', fixed))
    raw_backlog = bool(re.search(r'\bBacklog\b', raw))
    fixed_backlog = bool(re.search(r'\bBacklog\b', fixed))
    
    print(f"Raw:   Weeks={raw_weeks}/4, Status={raw_status}, Backlog={raw_backlog}")
    print(f"Fixed: Weeks={fixed_weeks}/4, Status={fixed_status}, Backlog={fixed_backlog}")
    print(f"Improvement: {'✓' if fixed_status < raw_status or fixed_backlog < raw_backlog else '—'}")
    
    results.append({'raw_weeks': raw_weeks, 'fixed_weeks': fixed_weeks, 'improved': fixed_status < raw_status or fixed_backlog < raw_backlog})

print(f"\n{'='*70}")
print("Summary:")
for i, r in enumerate(results, 1):
    print(f"  Example {i}: Weeks {r['raw_weeks']}->{r['fixed_weeks']}, Improved: {r['improved']}")
