"""
Quick test of strict Model 1 with actual dataset examples.
Tests with stricter validation against real dataset entries.
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

MODEL_ID = 'Qwen/Qwen2-0.5B-Instruct'
OUTPUT_DIR = Path('AI/llms/fine_tune/qwen_model1_overview_lora')
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

def validate_response(response: str) -> dict:
    """Check contract compliance."""
    checks = {
        'status_omitted': not bool(re.search(r'^Status\s*:', response, flags=re.MULTILINE | re.IGNORECASE)),
        'proposal_omitted': not bool(re.search(r'^Proposal\s*/\s*Input\s*:', response, flags=re.MULTILINE | re.IGNORECASE)),
        'backlog_omitted': not bool(re.search(r'^Backlog\s*:', response, flags=re.MULTILINE | re.IGNORECASE)),
    }
    
    weeks = re.findall(r'^Week\s*[1-4]\s*:\s*(.+)$', response, flags=re.MULTILINE | re.IGNORECASE)
    checks['weeks_found'] = len(weeks)
    checks['weeks_complete'] = len(weeks) == 4
    
    required_sections = ['Title', 'Summary', 'Roles', 'Features', 'Goals', 'Timeline']
    checks['title_present'] = bool(re.search(r'^Title\s*:', response, flags=re.MULTILINE | re.IGNORECASE))
    checks['summary_present'] = bool(re.search(r'^Summary\s*:', response, flags=re.MULTILINE | re.IGNORECASE))
    
    checks['overall_pass'] = all([
        checks['status_omitted'],
        checks['proposal_omitted'],
        checks['backlog_omitted'],
        checks['weeks_complete'],
        checks['title_present'],
        checks['summary_present']
    ])
    
    return checks

# Test with 2 dataset examples
dataset_file = DATASET_DIR / 'model1_description_to_part1.jsonl'
test_examples = []
with open(dataset_file, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i >= 2:
            break
        test_examples.append(json.loads(line.strip()))

print("=" * 80)
print("STRICT MODEL 1 INFERENCE TEST WITH REAL DATASET EXAMPLES")
print("=" * 80)

passed = 0
failed = 0

for idx, example in enumerate(test_examples, start=1):
    print(f"\n{'='*80}")
    print(f"EXAMPLE {idx}")
    print(f"{'='*80}")
    
    # Use original proposal from dataset
    proposal = example['prompt']
    expected = example['response']
    
    test_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nProposal / Input:\n{proposal}"
    
    print(f"Proposal: {proposal[:120]}...")
    
    # Generate
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
    
    # Validate
    result = validate_response(generated)
    
    print(f"\nGenerated (first 250 chars):\n{generated[:250]}...")
    print(f"\nValidation Results:")
    print(f"  ✓ Status omitted: {'PASS' if result['status_omitted'] else 'FAIL'}")
    print(f"  ✓ Proposal/Input omitted: {'PASS' if result['proposal_omitted'] else 'FAIL'}")
    print(f"  ✓ Backlog omitted: {'PASS' if result['backlog_omitted'] else 'FAIL'}")
    print(f"  ✓ Title present: {'PASS' if result['title_present'] else 'FAIL'}")
    print(f"  ✓ Summary present: {'PASS' if result['summary_present'] else 'FAIL'}")
    print(f"  ✓ Timeline weeks (4 required): {result['weeks_found']}/4 {'PASS' if result['weeks_complete'] else 'FAIL'}")
    print(f"\nResult: {'✓✓✓ PASS' if result['overall_pass'] else '✗✗✗ FAIL'}")
    
    if result['overall_pass']:
        passed += 1
    else:
        failed += 1

print(f"\n{'='*80}")
print(f"FINAL SUMMARY: {passed} PASSED, {failed} FAILED out of {len(test_examples)} examples")
print(f"{'='*80}")
if passed == len(test_examples):
    print("✓✓✓ ALL TESTS PASSED - Model meets strict compliance!")
else:
    print(f"✗ Model needs improvement - focus areas above")
