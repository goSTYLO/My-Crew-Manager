# Project LLM Fine-Tuning Dataset

One JSON object per line (JSONL format):

```json
{"prompt": "<full prompt text>", "response": "<exact expected output>"}
```

## Sections

- `summary.jsonl` - Project summaries (2-3 sentences)
- `features.jsonl` - Feature lists (features: prefix, - bullets)
- `roles.jsonl` - Role lists (roles: prefix, - bullets)
- `goals.jsonl` - Goals with title/role (title:, role:)
- `timeline.jsonl` - Timeline with week_number and goals
- `backlog.jsonl` - Epic/Sub-Epic/User Story/Task hierarchy

## Building the dataset

1. **Hand-curated**: Write proposals and ideal outputs; use `llms/prompts/*.txt` to build prompts.
2. **Synthetic**: Run `build_synthetic.py` (if created) with GPT-4/Claude to generate examples.
3. **Target**: 30-50 examples per section for good fine-tuning results.

## Seed examples

Each JSONL file contains at least one seed example. Add more to improve model quality.
