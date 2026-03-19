import sys, json, re
from pathlib import Path
from copy import deepcopy
sys.path.insert(0, str(Path('AI')))
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch

MODEL_ID = 'Qwen/Qwen2-0.5B-Instruct'
OUTPUT_DIR = Path('AI/llms/fine_tune/qwen_model1_overview_lora')
DATASET_DIR = Path('AI/llms/fine_tune/dataset')

print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
base_model = AutoModelForCausalLM.from_pretrained(MODEL_ID, dtype=torch.float16, trust_remote_code=True)
model_infer = PeftModel.from_pretrained(base_model, str(OUTPUT_DIR))
if torch.cuda.is_available():
    model_infer = model_infer.to('cuda')

prompt_template = """Transform proposal into structured overview.
Output ONLY: Title | Summary | Roles | Features | Goals | Timeline
No: Status, Proposal/Input, Backlog
Timeline: Week 1: task, task (for weeks 2,3,4)
Proposal: {}"""

print("Loading dataset example...")
with open(DATASET_DIR / 'model1_description_to_part1.jsonl') as f:
    example = json.loads(f.readline().strip())

test_prompt = prompt_template.format(example['prompt'])
print("Generating...")
inputs = tokenizer(test_prompt, return_tensors='pt')
if torch.cuda.is_available():
    inputs = {k: v.cuda() for k, v in inputs.items()}

gen_cfg = deepcopy(model_infer.generation_config)
gen_cfg.do_sample = False

outputs = model_infer.generate(**inputs, generation_config=gen_cfg, max_new_tokens=512, pad_token_id=tokenizer.eos_token_id, eos_token_id=tokenizer.eos_token_id, repetition_penalty=1.05, no_repeat_ngram_size=3)
generated = tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True).strip()

weeks = re.findall(r'Week\s+[1-4]', generated, flags=re.IGNORECASE)
has_status = bool(re.search(r'\bStatus\b', generated))
has_backlog = bool(re.search(r'\bBacklog\b', generated))

print('\nCONCISE PROMPT TEST RESULT')
print('='*70)
print('Output (first 280 chars):')
print(generated[:280])
print('='*70)
print(f'Weeks: {len(set(weeks))}/4')
print(f'Has Status: {has_status}')
print(f'Has Backlog: {has_backlog}')
overall = 'PASS' if len(set(weeks)) >= 4 and not has_status and not has_backlog else 'NEEDS WORK'
print(f'Result: {overall}')
