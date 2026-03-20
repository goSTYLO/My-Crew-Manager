#!/usr/bin/env python3
"""Tune Step 6 prompt+decoding for lower noise without retraining."""

from __future__ import annotations

import json
from pathlib import Path

NOTEBOOK = Path("TrainModel2_Backlog.ipynb")


def to_text(source):
    return "".join(source) if isinstance(source, list) else source


def to_source(text, was_list):
    if not was_list:
        return text
    lines = text.splitlines(keepends=True)
    if text and not text.endswith("\n"):
        lines.append("\n")
    return lines


def replace_exact(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Missing expected block for: {label}")
    return text.replace(old, new, 1)


def replace_between(text: str, start_marker: str, end_marker: str, replacement: str, label: str) -> str:
    start = text.find(start_marker)
    if start == -1:
        raise RuntimeError(f"Missing start marker for: {label}")
    end = text.find(end_marker, start)
    if end == -1:
        raise RuntimeError(f"Missing end marker for: {label}")
    return text[:start] + replacement + text[end:]


nb = json.loads(NOTEBOOK.read_text(encoding="utf-8"))

step6_idx = next(
    i
    for i, c in enumerate(nb["cells"])
    if c.get("cell_type") == "code"
    and "MODEL 2 INFERENCE TEST - FLAT BACKLOG FORMAT" in to_text(c.get("source", ""))
)
step61_idx = next(
    i
    for i, c in enumerate(nb["cells"])
    if c.get("cell_type") == "code"
    and "MODEL 2 DATASET VS GENERATED COMPARISON" in to_text(c.get("source", ""))
)

step6_cell = nb["cells"][step6_idx]
step61_cell = nb["cells"][step61_idx]

step6_was_list = isinstance(step6_cell["source"], list)
step61_was_list = isinstance(step61_cell["source"], list)

step6 = to_text(step6_cell["source"])
step61 = to_text(step61_cell["source"])

# 1) Remove few-shot loading from Step 6
new_fewshot = '''# Few-shot context disabled to reduce prompt noise and improve structural focus.
few_shot_examples = []
FEWSHOT_CONTEXT = ""
'''
step6 = replace_between(
    step6,
    '# Load few-shot examples from selected dataset (first 2 rows).\n',
    'BACKLOG_PROMPT_PATH = _ai_root / "llms" / "prompts" / "backlog_prompt.txt"\n',
    new_fewshot,
    "few-shot removal",
)
step6 = replace_exact(
    step6,
    'BACKLOG_PROMPT_PATH = _ai_root / "llms" / "prompts" / "backlog_prompt.txt"\n',
    '\nBACKLOG_PROMPT_PATH = _ai_root / "llms" / "prompts" / "backlog_prompt.txt"\n',
    "spacing after few-shot block",
)

# 2) Compact strict rules
step6 = replace_exact(step6, 'MAX_RULE_LINES = 20', 'MAX_RULE_LINES = 7', "max strict lines")

old_extra = '''EXTRA_STRICT_RULE_LINES = [
    "Output only backlog text in the required flat hierarchy.",
    "Use no decimals. Use only whole numbers: Epic 1, Sub-Epic 1, User Story 1, Task 1, Task 2.",
    "Use the proposal Goals section as epic titles; map Goal 1 to Epic 1, Goal 2 to Epic 2, etc.",
    "Do not invent epics outside the Goals section.",
    "Use Epic heading first, then Sub-Epic 1, then User Story 1, then Task 1 and Task 2.",
    "Use exactly one Sub-Epic per Epic (numbered 1 only).",
    "Use exactly one User Story per Sub-Epic (numbered 1 only).",
    "Use exactly two Tasks per User Story (numbered 1 and 2 only).",
    "Each task must be specific and implementation-ready. Avoid generic wording.",
    "Do not output Status, Summary, Roles, Features, Timeline, or Proposal/Input sections.",
    f"After the final task, output {OUTPUT_END_MARKER} on its own line and stop.",
]
'''
new_extra = '''EXTRA_STRICT_RULE_LINES = [
    "Output only flat backlog hierarchy.",
    "Map Goals to epics in exact order: Goal 1->Epic 1, Goal 2->Epic 2, etc.",
    "Use exact headers only: Epic N, -Sub-Epic 1, -User Story 1, -Task 1, -Task 2.",
    "Start with Epic 1 and continue sequentially with no skipped epic numbers.",
    "Exactly one Sub-Epic and one User Story per Epic; exactly two Tasks per User Story.",
    "No Status/Summary/Roles/Features/Timeline/Proposal sections.",
    f"After final Task 2, output {OUTPUT_END_MARKER} and stop immediately.",
]
'''
step6 = replace_exact(step6, old_extra, new_extra, "extra strict rules")

old_prefix = '''BASE_GUIDED_PREFIX = (
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
)
'''
new_prefix = '''BASE_GUIDED_PREFIX = (
    "Generate backlog only in strict flat hierarchy.\\n"
    "Goals determine epic count exactly (N goals -> N epics).\\n"
    "Use no decimals. Start with Epic 1 and continue sequentially.\\n"
    "Per Epic: exactly 1 Sub-Epic 1, 1 User Story 1, and Task 1 + Task 2.\\n"
    "Each task must be implementation-ready with concrete deliverable language.\\n\\n"
    "Template:\\n"
    "Epic 1: <Goal 1 title>\\n"
    "-Sub-Epic 1: <phase>\\n"
    " -User Story 1: As a <role>, I want <capability> so that <benefit>\\n"
    "  -Task 1: <specific technical action + artifact>\\n"
    "  -Task 2: <specific technical action + artifact>\\n\\n"
    f"After final Task 2, output {OUTPUT_END_MARKER} on its own line and stop.\\n"
)
'''
step6 = replace_exact(step6, old_prefix, new_prefix, "guided prefix compact")

step6 = replace_exact(
    step6,
    '    strict_constraints_block = "Additional strict format guidance:\\n" + "\\n".join(',
    '    strict_constraints_block = "Strict rules:\\n" + "\\n".join(',
    "constraints label",
)

# 3) Token strategy + decoding tuning
step6 = replace_exact(step6, 'TOKENS_BY_STRATEGY = {"B": 520, "C": 520}', 'TOKENS_BY_STRATEGY = {"B": 420, "C": 520}', "adaptive token budget")
step6 = replace_exact(step6, '            repetition_penalty=1.05,', '            repetition_penalty=1.12,', "repetition penalty")
step6 = replace_exact(step6, '            no_repeat_ngram_size=4,\n', '', "remove no_repeat_ngram")

# 4) Add noise detectors
insert_after = '''def _sanitize_backlog_response(response: str) -> str:
    text = _normalize_backlog_labels(response)
    cleaned_lines = []
    for line in text.splitlines():
        if re.match(r"(?im)^\\s*(Status|Summary|Roles|Features|Timeline|Proposal\\s*/\\s*Input)\\s*:", line):
            continue
        if re.match(r"(?im)^\\s*(===\\s*(Status|Summary|Roles|Features|Timeline|Proposal|Requirement).+===)\\s*$", line):
            continue
        cleaned_lines.append(line)
    text = "\\n".join(cleaned_lines).strip()

    # Backfill sub-epic lines when model emits Epic -> User Story directly (flat format).
    rebuilt = []
    epic_counter = 0
    sub_exists_for_epic = False
    for line in text.splitlines():
        stripped = line.strip()
        epic_match = re.match(r"^Epic\\s*(\\d+)\\s*:\\s*(.+)$", stripped, re.IGNORECASE)
        if epic_match:
            epic_counter = int(epic_match.group(1))
            sub_exists_for_epic = False
            rebuilt.append(f"Epic {epic_counter}: {epic_match.group(2).strip()}")
            continue

        # Match flat Sub-Epic (e.g., "Sub-Epic 1:", not "Sub-Epic 1.1:")
        if re.match(r"^-?\\s*Sub-?Epic\\s*\\d+\\s*:\\s*.+$", stripped, re.IGNORECASE):
            sub_exists_for_epic = True
            rebuilt.append(stripped)
            continue

        # Match flat User Story (e.g., "User Story 1:", not "User Story 1.1.1:")
        if re.match(r"^-?\\s*User\\s+Story\\s+\\d+\\s*:\\s*.+$", stripped, re.IGNORECASE):
            if epic_counter > 0 and not sub_exists_for_epic:
                rebuilt.append(f"-Sub-Epic 1: Implementation for Epic {epic_counter}")
                sub_exists_for_epic = True
            rebuilt.append(stripped)
            continue

        rebuilt.append(stripped)

    text = "\\n".join(rebuilt).strip()
    return text


'''
insert_block = '''def _has_malformed_headers(raw_text: str) -> bool:
    patterns = [
        r"(?im)^\\s*Epi\\s*$",
        r"(?im)^\\s*C\\s*\\d+\\s*:",
        r"(?im)^\\s*-Sub-Ep(?!ic\\s*1\\s*:)",
        r"(?im)^\\s*-Sub-\\s*$",
        r"(?im)^\\s*-User\\s*$",
        r"(?im)^\\s*-Task\\s*$",
        r"(?im)^\\s*UserStory\\s*:",
    ]
    return any(re.search(p, raw_text) for p in patterns)


def _has_noise_markers(raw_text: str) -> bool:
    low = raw_text.lower()
    noise_tokens = [
        "-status",
        "-summary",
        "-roles",
        "-features",
        "-timeline",
        "-proposal",
        "-requirements",
        "end_of_backlog",
        "backlog hierarchy",
    ]
    return any(tok in low for tok in noise_tokens)


'''
step6 = replace_exact(step6, insert_after, insert_after + insert_block, "noise helper insertion")

# 5) Rewrite B/C strategy flow to use expected epics and stronger retries
old_loop_start = '    proposal = example["prompt"]\n    epic_anchor_block = _build_epic_anchor_block(proposal)\n    candidates = []\n'
new_loop_start = '    proposal = example["prompt"]\n    expected_epic_count = len(_extract_goal_epic_titles(proposal)) or 5\n    epic_anchor_block = _build_epic_anchor_block(proposal)\n    candidates = []\n'
step6 = replace_exact(step6, old_loop_start, new_loop_start, "expected epics in loop")

old_b_block = '''    if "B" in STRATEGIES_TO_RUN:
        prompt_b = GUIDED_PREFIX + epic_anchor_block + "Input:\\n" + proposal + "\\n\\nBacklog:\\n"
        raw_b = _generate(prompt_b, max_new_tokens=TOKENS_BY_STRATEGY["B"])
        clean_b = _sanitize_backlog_response(raw_b)
        score_b = _compliance_score(clean_b)
        # Retry if structure is incomplete (any cardinality failure or no epics)
        if (score_b["epic_count"] == 0 or 
            score_b["invalid_sub_epic_count"] > 0 or 
            score_b["invalid_story_count"] > 0 or 
            score_b["invalid_task_count"] > 0):
            retry_b = (
                GUIDED_PREFIX
                + epic_anchor_block
                + "Input:\\n" + proposal + "\\n\\n"
                + "Return only backlog hierarchy. Begin immediately with Epic 1:.\\n"
            )
            raw_b = _generate(retry_b, max_new_tokens=TOKENS_BY_STRATEGY["B"])
            clean_b = _sanitize_backlog_response(raw_b)
            score_b = _compliance_score(clean_b)
        candidates.append(("B: guided (no few-shot)", clean_b, score_b))
'''
new_b_block = '''    if "B" in STRATEGIES_TO_RUN:
        prompt_b = GUIDED_PREFIX + epic_anchor_block + "Input:\\n" + proposal + "\\n\\nBacklog:\\n"
        raw_b = _generate(prompt_b, max_new_tokens=TOKENS_BY_STRATEGY["B"])
        clean_b = _sanitize_backlog_response(raw_b)
        score_b = _compliance_score(clean_b)
        needs_retry_b = (
            score_b["epic_count"] != expected_epic_count
            or score_b["invalid_sub_epic_count"] > 0
            or score_b["invalid_story_count"] > 0
            or score_b["invalid_task_count"] > 0
            or _has_malformed_headers(raw_b)
            or _has_noise_markers(raw_b)
            or not clean_b.lstrip().lower().startswith("epic 1:")
            or OUTPUT_END_MARKER not in raw_b
        )
        if needs_retry_b:
            retry_b = (
                GUIDED_PREFIX
                + epic_anchor_block
                + "Input:\\n" + proposal + "\\n\\n"
                + "Return only flat backlog. Start with Epic 1:. Use exactly one Sub-Epic 1, one User Story 1, and Task 1/Task 2 per Epic. "
                + f"Generate exactly {expected_epic_count} epics. End with {OUTPUT_END_MARKER}.\\n\\nBacklog:\\n"
            )
            raw_b = _generate(retry_b, max_new_tokens=min(TOKENS_BY_STRATEGY["B"] + 100, 620))
            clean_b = _sanitize_backlog_response(raw_b)
            score_b = _compliance_score(clean_b)
        candidates.append(("B: compact strict", clean_b, score_b))
'''
step6 = replace_exact(step6, old_b_block, new_b_block, "strategy B rewrite")

old_c_block = '''    if "C" in STRATEGIES_TO_RUN:
        prompt_c = GUIDED_PREFIX + epic_anchor_block + "Input:\\n" + proposal + "\\n\\nBacklog:\\n==="
        raw_c = _generate(prompt_c, max_new_tokens=TOKENS_BY_STRATEGY["C"])
        clean_c = _sanitize_backlog_response("===" + raw_c)
        score_c = _compliance_score(clean_c)
        # Retry if structure is incomplete (any cardinality failure or no epics)
        if (score_c["epic_count"] == 0 or 
            score_c["invalid_sub_epic_count"] > 0 or 
            score_c["invalid_story_count"] > 0 or 
            score_c["invalid_task_count"] > 0):
            retry_c = (
                GUIDED_PREFIX
                + epic_anchor_block
                + "Input:\\n" + proposal + "\\n\\n"
                + "Return only backlog hierarchy. Begin immediately with Epic 1:.\\n"
            )
            raw_c = _generate(retry_c, max_new_tokens=TOKENS_BY_STRATEGY["C"])
            clean_c = _sanitize_backlog_response(raw_c)
            score_c = _compliance_score(clean_c)
        candidates.append(("C: guided (structural anchor)", clean_c, score_c))
'''
new_c_block = '''    if "C" in STRATEGIES_TO_RUN:
        prompt_c = GUIDED_PREFIX + epic_anchor_block + "Input:\\n" + proposal + "\\n\\nBacklog:\\n"
        raw_c = _generate(prompt_c, max_new_tokens=TOKENS_BY_STRATEGY["C"])
        clean_c = _sanitize_backlog_response(raw_c)
        score_c = _compliance_score(clean_c)
        needs_retry_c = (
            score_c["epic_count"] != expected_epic_count
            or score_c["invalid_sub_epic_count"] > 0
            or score_c["invalid_story_count"] > 0
            or score_c["invalid_task_count"] > 0
            or _has_malformed_headers(raw_c)
            or _has_noise_markers(raw_c)
            or not clean_c.lstrip().lower().startswith("epic 1:")
            or OUTPUT_END_MARKER not in raw_c
        )
        if needs_retry_c:
            retry_c = (
                GUIDED_PREFIX
                + epic_anchor_block
                + "Input:\\n" + proposal + "\\n\\n"
                + "Return only flat backlog. Start with Epic 1:. Use exact hierarchy headers and do not add extra sections. "
                + f"Generate exactly {expected_epic_count} epics and end with {OUTPUT_END_MARKER}.\\n\\nBacklog:\\n"
            )
            raw_c = _generate(retry_c, max_new_tokens=min(TOKENS_BY_STRATEGY["C"] + 100, 620))
            clean_c = _sanitize_backlog_response(raw_c)
            score_c = _compliance_score(clean_c)
        candidates.append(("C: compact strict+anchor", clean_c, score_c))
'''
step6 = replace_exact(step6, old_c_block, new_c_block, "strategy C rewrite")

if 'Few-shot examples loaded:' not in step6:
    raise RuntimeError("Missing expected line for few-shot print")
step6 = step6.replace(
    'print(f"Few-shot examples loaded: {len(few_shot_examples)}")',
    'print("Few-shot examples loaded: 0")',
    1,
)

old_compliant = '''    compliant = (
        4 <= best_score["epic_count"] <= 6
        and best_score["invalid_sub_epic_count"] == 0
        and best_score["invalid_story_count"] == 0
        and best_score["invalid_task_count"] == 0
        and not best_score["has_forbidden"]
        and not best_score["has_duplicates"]
        and not best_score["has_generic_tasks"]
    )
'''
new_compliant = '''    compliant = (
        best_score["epic_count"] == expected_epic_count
        and best_score["invalid_sub_epic_count"] == 0
        and best_score["invalid_story_count"] == 0
        and best_score["invalid_task_count"] == 0
        and not best_score["has_forbidden"]
        and not best_score["has_duplicates"]
        and not best_score["has_generic_tasks"]
    )
'''
step6 = replace_exact(step6, old_compliant, new_compliant, "strict compliant gate")

# 6) Step 6.1 cleanup
step61 = replace_exact(step61, '    "FEWSHOT_CONTEXT",\n', '', "remove FEWSHOT_CONTEXT required name")

step6_cell["source"] = to_source(step6, step6_was_list)
step61_cell["source"] = to_source(step61, step61_was_list)

NOTEBOOK.write_text(json.dumps(nb, indent=4, ensure_ascii=False), encoding="utf-8")
print("Updated TrainModel2_Backlog.ipynb with Step 6 prompt-noise tuning.")
