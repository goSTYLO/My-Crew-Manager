#!/usr/bin/env python3
"""Update TrainModel2_Backlog notebook for prompt-only recovery path."""

import json
import re
from pathlib import Path

notebook_path = Path("TrainModel2_Backlog.ipynb")

if not notebook_path.exists():
    print(f"ERROR: {notebook_path} not found")
    exit(1)

with open(notebook_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

print("=" * 80)
print("NOTEBOOK UPDATE: Prompt-Only Recovery Path")
print("=" * 80)

update_count = 0

for i, cell in enumerate(nb['cells']):
    if cell['cell_type'] != 'code':
        continue
    
    # Reconstruct source from list of strings
    if isinstance(cell['source'], list):
        source = ''.join(cell['source'])
    else:
        source = cell['source']
    
    new_source = source
    
    # Update 1: Token budget 420/460 -> 520
    if 'TOKENS_BY_STRATEGY = {' in source and '420' in source:
        new_source = new_source.replace(
            'TOKENS_BY_STRATEGY = {"B": 420, "C": 460}',
            'TOKENS_BY_STRATEGY = {"B": 520, "C": 520}'
        )
        print(f"\n[Cell {i}] ✓ Updated token budget to 520")
        update_count += 1
    
    # Update 2: Remove few-shot loading and assembly
    if 'few_shot_examples = []' in source and 'with open(dataset_file' in source and 'FEWSHOT_CONTEXT = ""' not in source:
        # Find the block to replace
        pattern = r'# Load few-shot examples.*?FEWSHOT_CONTEXT = "\\n\\n---\\n\\n"\\.join\(shot_blocks\) \+ "\\n\\n---\\n\\n"'
        match = re.search(pattern, new_source, re.DOTALL)
        if match:
            replacement = '''# Few-shot context removed for prompt clarity and to reduce prompt noise.
# Model trained on flat format; strict rules in GUIDED_PREFIX are sufficient.
few_shot_examples = []
FEWSHOT_CONTEXT = ""'''
            new_source = new_source[:match.start()] + replacement + new_source[match.end():]
            print(f"[Cell {i}] ✓ Removed few-shot context loading")
            update_count += 1
    
    # Update 3: Replace BASE_GUIDED_PREFIX with strict flat template
    if 'BASE_GUIDED_PREFIX = (' in source and 'Generate backlog using exactly this flat' in source:
        # Find the BASE_GUIDED_PREFIX definition block
        start = source.find('BASE_GUIDED_PREFIX = (')
        if start >= 0:
            # Find the closing parenthesis (accounting for nested strings)
            paren_count = 0
            end_idx = start + len('BASE_GUIDED_PREFIX = (')
            in_string = False
            escape_next = False
            
            for j in range(end_idx, len(source)):
                char = source[j]
                
                if escape_next:
                    escape_next = False
                    continue
                
                if char == '\\':
                    escape_next = True
                    continue
                
                if char == '"':
                    in_string = not in_string
                    continue
                
                if not in_string:
                    if char == '(':
                        paren_count += 1
                    elif char == ')':
                        if paren_count == 0:
                            end_idx = j
                            break
                        paren_count -= 1
            
            if end_idx > start:
                replacement = '''BASE_GUIDED_PREFIX = (
    "You are an AI assistant generating a project backlog in a strict flat hierarchy (no decimals).\\n\\n"
    "FLAT HIERARCHY CONTRACT:\\n"
    "- Epic count MUST match the number of Goals provided (if 5 goals → 5 epics, always).\\n"
    "- Each Epic: exactly 1 Sub-Epic (numbered 1 only), exactly 1 User Story, exactly 2 Tasks.\\n"
    "- Numbering: Epic 1, Sub-Epic 1, User Story 1, Task 1, Task 2 (NO decimals like 1.1 or 1.1.1).\\n"
    "- Task format: Implementation-ready descriptions (not generic; reference roles, tools, artifacts).\\n\\n"
    "GROUNDING FROM PROPOSAL:\\n"
    "1. Extract and read Summary: for domain/user context.\\n"
    "2. Extract Roles: inform 'As a <role>' phrasing (generic actors allowed).\\n"
    "3. Extract Features: use as scope boundary (no tasks outside features).\\n"
    "4. Extract Goals: become Epic 1...N titles IN ORDER (no reordering, no inventing).\\n"
    "5. Extract Timeline: soft context hint for task phases (not a hard constraint).\\n\\n"
    "OUTPUT STRUCTURE:\\n"
    "Epic 1: <Goal 1 Title>\\n"
    "-Sub-Epic 1: <Implementation phase for Goal 1>\\n"
    " -User Story 1: As a <role>, I want <capability> so that <benefit>\\n"
    "  -Task 1: <Specific, implementation-ready action with concrete deliverable>\\n"
    "  -Task 2: <Specific, implementation-ready action with concrete deliverable>\\n\\n"
    "[Repeat for each Goal exactly as above, no variations]\\n\\n"
    "FORBIDDEN:\\n"
    "- Do NOT output Status, Summary, Roles, Features, Timeline, Proposal, or Requirement sections.\\n"
    "- Do NOT use decimals (1.1, 1.1.1, 1.1.1.1).\\n"
    "- Do NOT repeat headers or create duplicates.\\n"
    "- Do NOT output metadata like 'Backlog Hierarchy:', 'End of backlog:'.\\n"
    "- Do NOT create generic tasks ('implement module', 'design system', 'perform testing').\\n\\n"
    "TERMINATION:\\n"
    f"After final Task 2 of the last Epic, output {OUTPUT_END_MARKER} on its own line. STOP IMMEDIATELY.\\n"
)'''
                new_source = new_source[:start] + replacement + new_source[end_idx + 1:]
                print(f"[Cell {i}] ✓ Replaced BASE_GUIDED_PREFIX with strict flat template")
                update_count += 1
    
    # Update 4: Remove FEWSHOT_CONTEXT from prompt_b assembly
    if 'prompt_b = FEWSHOT_CONTEXT + GUIDED_PREFIX' in source:
        new_source = new_source.replace(
            'prompt_b = FEWSHOT_CONTEXT + GUIDED_PREFIX',
            'prompt_b = GUIDED_PREFIX'
        )
        print(f"[Cell {i}] ✓ Removed FEWSHOT_CONTEXT from prompt_b")
        update_count += 1
    
    # Update 5: Update retry logic for prompt_b to check structural failures
    if 'if score_b["epic_count"] == 0:' in source and 'retry_b = (' in source:
        old_retry = '''if score_b["epic_count"] == 0:
            retry_b = (
                GUIDED_PREFIX
                + epic_anchor_block'''
        new_retry = '''# Retry if structure is incomplete (any cardinality failure or no epics)
        if (score_b["epic_count"] == 0 or 
            score_b["invalid_sub_epic_count"] > 0 or 
            score_b["invalid_story_count"] > 0 or 
            score_b["invalid_task_count"] > 0):
            retry_b = (
                GUIDED_PREFIX
                + epic_anchor_block'''
        new_source = new_source.replace(old_retry, new_retry)
        print(f"[Cell {i}] ✓ Updated retry logic for structural failure check")
        update_count += 1
    
    # Update 6: Remove FEWSHOT_CONTEXT from prompt_c assembly
    if 'prompt_c = FEWSHOT_CONTEXT + GUIDED_PREFIX' in source:
        new_source = new_source.replace(
            'prompt_c = FEWSHOT_CONTEXT + GUIDED_PREFIX',
            'prompt_c = GUIDED_PREFIX'
        )
        print(f"[Cell {i}] ✓ Removed FEWSHOT_CONTEXT from prompt_c")
        update_count += 1
    
    # Update 7: Update retry logic for prompt_c
    if 'if score_c["epic_count"] == 0:' in source and 'prompt_c' in source:
        old_retry_c = '''if score_c["epic_count"] == 0:
            retry_c = (
                GUIDED_PREFIX
                + epic_anchor_block'''
        new_retry_c = '''# Retry if structure is incomplete (any cardinality failure or no epics)
        if (score_c["epic_count"] == 0 or 
            score_c["invalid_sub_epic_count"] > 0 or 
            score_c["invalid_story_count"] > 0 or 
            score_c["invalid_task_count"] > 0):
            retry_c = (
                GUIDED_PREFIX
                + epic_anchor_block'''
        new_source = new_source.replace(old_retry_c, new_retry_c)
        print(f"[Cell {i}] ✓ Updated retry logic for prompt_c structural failure")
        update_count += 1
    
    # Update 8: Remove FEWSHOT_CONTEXT from Step 6.1 comparison
    if 'prompt_cmp = FEWSHOT_CONTEXT + GUIDED_PREFIX' in source:
        new_source = new_source.replace(
            'prompt_cmp = FEWSHOT_CONTEXT + GUIDED_PREFIX',
            'prompt_cmp = GUIDED_PREFIX'
        )
        print(f"[Cell {i}] ✓ Removed FEWSHOT_CONTEXT from Step 6.1 comparison")
        update_count += 1
    
    # Update 9: Update fallback token in Step 6.1
    if 'TOKENS_BY_STRATEGY.get("B", 420)' in source:
        new_source = new_source.replace(
            'TOKENS_BY_STRATEGY.get("B", 420)',
            'TOKENS_BY_STRATEGY.get("B", 520)'
        )
        print(f"[Cell {i}] ✓ Updated fallback token in Step 6.1")
        update_count += 1
    
    # Update 10: Update strategy labels to reflect no few-shot
    if '"B: guided+few-shot"' in source:
        new_source = new_source.replace(
            '"B: guided+few-shot"',
            '"B: guided (no few-shot)"'
        )
        print(f"[Cell {i}] ✓ Updated strategy label for B")
        update_count += 1
    
    if '"C: guided+few-shot+anchor"' in source:
        new_source = new_source.replace(
            '"C: guided+few-shot+anchor"',
            '"C: guided (structural anchor)"'
        )
        print(f"[Cell {i}] ✓ Updated strategy label for C")
        update_count += 1
    
    # Restore source as list if it was a list
    if isinstance(cell['source'], list):
        cell['source'] = new_source.split('\n')[:-1]  # Split preserves newlines in list
        for j in range(len(cell['source'])):
            if j < len(cell['source']) - 1:
                cell['source'][j] += '\n'
    else:
        cell['source'] = new_source

print(f"\n{'=' * 80}")
print(f"Total updates applied: {update_count}")

# Save updated notebook
with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print(f"✓ Notebook saved to {notebook_path}")
print("\nReady to run Step 6 inference test with updated prompt!")
