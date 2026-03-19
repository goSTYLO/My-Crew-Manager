"""
Augment training dataset with stricter system instructions.
Reads the original model1_description_to_part1.jsonl and prepends 
a strict system prompt to each training example.
"""

import json
from pathlib import Path

DATASET_DIR = Path(__file__).parent / "dataset"
ORIGINAL_JSONL = DATASET_DIR / "model1_description_to_part1.jsonl"
OUTPUT_JSONL = DATASET_DIR / "model1_description_to_part1_strict.jsonl"

# Stricter system prompt that emphasizes hard constraints
STRICT_SYSTEM_PROMPT = """You are a project proposal analyzer. Your task is to transform raw project descriptions into structured, plain-text project overviews.

CRITICAL CONSTRAINTS (non-negotiable):
1. Output EXACTLY these 6 sections in this exact order: Title, Summary, Roles, Features, Goals, Timeline
2. FORBIDDEN SECTIONS - Never output any of these: Status, Proposal/Input, Backlog, Requirements, or any other sections
3. Timeline MUST contain exactly 4 weeks: Week 1, Week 2, Week 3, Week 4
4. Each week MUST list exactly 2 tasks (no more, no less)
5. Format each week as: "Week X: Task description 1, Task description 2"

STRICT OUTPUT FORMAT:
Title: [Project name]
Summary: [Comprehensive project description]
Roles: [List of roles required]
Features: [Key features to implement]
Goals: [Project objectives]
Timeline:
Week 1: [task], [task]
Week 2: [task], [task]
Week 3: [task], [task]
Week 4: [task], [task]

Remember: Any deviation from this structure will be treated as a failure. Do NOT add Status, do NOT repeat the input, do NOT include Backlog."""

def augment_dataset():
    """Regenerate JSONL with stricter prompts."""
    
    if not ORIGINAL_JSONL.exists():
        raise FileNotFoundError(f"Original dataset not found: {ORIGINAL_JSONL}")
    
    augmented_count = 0
    
    with open(ORIGINAL_JSONL, 'r', encoding='utf-8') as infile, \
         open(OUTPUT_JSONL, 'w', encoding='utf-8') as outfile:
        
        for line in infile:
            line = line.strip()
            if not line:
                continue
            
            entry = json.loads(line)
            
            # Prepend strict system prompt to the user prompt
            original_prompt = entry.get("prompt", "")
            augmented_prompt = f"{STRICT_SYSTEM_PROMPT}\n\nProposal / Input:\n{original_prompt}"
            
            # Create augmented entry
            augmented_entry = {
                "prompt": augmented_prompt,
                "response": entry.get("response", "")
            }
            
            outfile.write(json.dumps(augmented_entry, ensure_ascii=False) + "\n")
            augmented_count += 1
    
    print(f"Augmented {augmented_count} entries with strict system prompt")
    print(f"Wrote to: {OUTPUT_JSONL}")
    print(f"\nStrict system prompt ({len(STRICT_SYSTEM_PROMPT)} chars):")
    print(STRICT_SYSTEM_PROMPT[:200] + "...")

if __name__ == "__main__":
    augment_dataset()
