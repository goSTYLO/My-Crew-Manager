# Compare expected dataset responses vs fresh model outputs on selected rows.
# Requires Step 6 helper functions to be available in kernel state.

required_names = [
    "selected_rows_sorted",
    "examples_by_row",
    "_sanitize_backlog_response",
    "_compliance_score",
    "_generate",
    "_build_prompt",
    "OUTPUT_END_MARKER",
]
missing = [name for name in required_names if name not in globals()]
if missing:
    raise RuntimeError(
        "Run Step 6 first so comparison helpers are loaded. Missing: " + ", ".join(missing)
    )

print("=" * 90)
print("MODEL 2 DATASET VS GENERATED COMPARISON")
print("=" * 90)

comparison_rows = selected_rows_sorted
comparison_results = []

for row_num in comparison_rows:
    example = examples_by_row[row_num]
    proposal = example["prompt"]
    _, expected_epic_count = _build_prompt(proposal)

    target_raw = example.get("response", "")
    target_clean = _sanitize_backlog_response(target_raw)
    target_score = _compliance_score(
        target_clean,
        expected_epic_count=expected_epic_count,
        has_exact_marker=(OUTPUT_END_MARKER in target_raw),
        require_marker=False,
        raw_response=target_raw,
    )

    prompt_cmp, _ = _build_prompt(proposal)
    generated_raw = _generate(prompt_cmp, max_new_tokens=TOKENS_BY_STRATEGY.get("B", 420))
    generated_clean = _sanitize_backlog_response(generated_raw)
    generated_score = _compliance_score(
        generated_clean,
        expected_epic_count=expected_epic_count,
        has_exact_marker=(OUTPUT_END_MARKER in generated_raw),
        require_marker=False,
        raw_response=generated_raw,
    )

    result = {
        "row": row_num,
        "expected_epic_count": expected_epic_count,
        "target_score": target_score,
        "generated_score": generated_score,
        "target_output": target_clean,
        "generated_output": generated_clean,
    }
    comparison_results.append(result)

    print(f"\nRow {row_num}")
    print(
        "Target   -> "
        f"score={target_score['score']}, epics={target_score['epic_count']}/{expected_epic_count}, "
        f"invalid_sub={target_score['invalid_sub_epic_count']}, invalid_story={target_score['invalid_story_count']}, "
        f"invalid_task={target_score['invalid_task_count']}, forbidden={target_score['has_forbidden']}, "
        f"duplicates={target_score['has_duplicates']}, generic={target_score['has_generic_tasks']}, "
        f"malformed={target_score['has_malformed_headers']}"
    )
    print(
        "Generated-> "
        f"score={generated_score['score']}, epics={generated_score['epic_count']}/{expected_epic_count}, "
        f"invalid_sub={generated_score['invalid_sub_epic_count']}, invalid_story={generated_score['invalid_story_count']}, "
        f"invalid_task={generated_score['invalid_task_count']}, forbidden={generated_score['has_forbidden']}, "
        f"duplicates={generated_score['has_duplicates']}, generic={generated_score['has_generic_tasks']}, "
        f"malformed={generated_score['has_malformed_headers']}, end_marker={generated_score['has_exact_end_marker']}"
    )

target_pass = sum(
    1 for r in comparison_results
    if r["target_score"]["epic_count"] == r["expected_epic_count"]
    and r["target_score"]["invalid_sub_epic_count"] == 0
    and r["target_score"]["invalid_story_count"] == 0
    and r["target_score"]["invalid_task_count"] == 0
    and not r["target_score"]["has_forbidden"]
    and not r["target_score"]["has_duplicates"]
    and not r["target_score"]["has_generic_tasks"]
    and not r["target_score"]["has_malformed_headers"]
)
generated_pass = sum(
    1 for r in comparison_results
    if r["generated_score"]["epic_count"] == r["expected_epic_count"]
    and r["generated_score"]["invalid_sub_epic_count"] == 0
    and r["generated_score"]["invalid_story_count"] == 0
    and r["generated_score"]["invalid_task_count"] == 0
    and not r["generated_score"]["has_forbidden"]
    and not r["generated_score"]["has_duplicates"]
    and not r["generated_score"]["has_generic_tasks"]
    and not r["generated_score"]["has_malformed_headers"]
    and not r["generated_score"]["has_format_issues"]
)

print("\n" + "=" * 90)
print(f"Target compliant rows (exact goal-epic): {target_pass}/{len(comparison_results)}")
print(f"Generated compliant rows (structure match, no end-marker required): {generated_pass}/{len(comparison_results)}")