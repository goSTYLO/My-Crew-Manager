import sys
from pathlib import Path
sys.path.insert(0, str(Path('AI')))

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import re
import torch
from copy import deepcopy

MODEL_ID = 'Qwen/Qwen2-1.5B-Instruct'
OUTPUT_DIR = Path('AI/llms/fine_tune/qwen_model1_overview_lora_1p5b')

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(MODEL_ID, dtype=torch.float16, trust_remote_code=True)
model_infer = PeftModel.from_pretrained(base_model, str(OUTPUT_DIR))
if torch.cuda.is_available():
    model_infer = model_infer.to('cuda')

test_prompt = """You are tasked with generating project proposals in plain text format.
Return ONLY these sections in this exact order:
1. Title (=== Project Name === or Title: Project Name)
2. Summary
3. Roles
4. Features
5. Goals
6. Timeline

Rules:
- Prompt input is the user's Proposal / Input text.
- Do NOT output Status.
- Do NOT repeat Proposal / Input in the response.
- Do NOT output Backlog.
- Timeline must have Week 1 to Week 4, each with exactly two tasks.

Proposal / Input:
Develop a task management web app for small teams with Kanban boards and real-time updates. It should support assignments, notifications, and progress tracking while staying easy to onboard and deploy.
"""

inputs = tokenizer(test_prompt, return_tensors='pt')
if torch.cuda.is_available():
    inputs = {k: v.cuda() for k, v in inputs.items()}

gen_cfg = deepcopy(model_infer.generation_config)
gen_cfg.do_sample = False
gen_cfg.temperature = None
gen_cfg.top_p = None
gen_cfg.top_k = None

outputs = model_infer.generate(**inputs, generation_config=gen_cfg, max_new_tokens=512, pad_token_id=tokenizer.eos_token_id, eos_token_id=tokenizer.eos_token_id, repetition_penalty=1.05, no_repeat_ngram_size=3)
response = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True).strip()

# Parse sections
patterns = {
    'title': r'(?:^===\s*(.+?)\s*===\s*$)|(?:^Title\s*:\s*(.+)$)',
    'summary': r'^Summary\s*:\s*([\s\S]*?)(?=^Roles\s*:|\Z)',
    'roles': r'^Roles\s*:\s*([\s\S]*?)(?=^Features\s*:|\Z)',
    'features': r'^Features\s*:\s*([\s\S]*?)(?=^Goals\s*:|\Z)',
    'goals': r'^Goals\s*:\s*([\s\S]*?)(?=^Timeline\s*:|\Z)',
    'timeline': r'^Timeline\s*:\s*([\s\S]*?)$',
}

print('===== INFERENCE TEST RESULTS =====')
print(f'Response length: {len(response)} chars\n')

# Section detection
title_match = re.search(patterns['title'], response, flags=re.MULTILINE | re.IGNORECASE)
title = (title_match.group(1) or title_match.group(2) or '').strip() if title_match else None

sections = {'title': title}
for key in ['summary', 'roles', 'features', 'goals', 'timeline']:
    m = re.search(patterns[key], response, flags=re.MULTILINE | re.IGNORECASE)
    if m:
        sections[key] = m.group(1).strip()[:50] + '...' if len(m.group(1).strip()) > 50 else m.group(1).strip()

required = ['title', 'summary', 'roles', 'features', 'goals', 'timeline']
missing = [k for k in required if not sections.get(k)]

print('----- SECTION DETECTION -----')
for req in required:
    status = 'OK' if sections.get(req) else 'MISSING'
    section_val = sections.get(req, 'MISSING')
    print(f'{status}: {req.upper()} = {section_val}')

print('\n----- CONTRACT COMPLIANCE -----')
status_fail = re.search(r'^Status\s*:', response, flags=re.MULTILINE | re.IGNORECASE)
print(f'Status field: {"FAIL" if status_fail else "PASS"}')

prop_fail = re.search(r'^Proposal\s*/\s*Input\s*:', response, flags=re.MULTILINE | re.IGNORECASE)
print(f'Proposal/Input repeated: {"FAIL" if prop_fail else "PASS"}')

backlog_fail = re.search(r'^Backlog\s*:', response, flags=re.MULTILINE | re.IGNORECASE)
print(f'Backlog included: {"FAIL" if backlog_fail else "PASS"}')

weeks = re.findall(r'^Week\s*[1-4]\s*:\s*(.+)$', response, flags=re.MULTILINE | re.IGNORECASE)
print(f'Timeline weeks: {len(weeks)}/4 found')

print('\n----- OVERALL RESULT -----')
all_pass = not missing and not status_fail and not prop_fail and not backlog_fail and len(weeks) == 4
print(f'Status: {"PASS" if all_pass else "NEEDS REVIEW"}')

print('\n----- SAMPLE OUTPUT (first 400 chars) -----')
print(response[:400])
