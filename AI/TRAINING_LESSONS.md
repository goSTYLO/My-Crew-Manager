# Model 1 Training - Lessons Learned & Best Approach

## Training Experiments Summary

### Experiment 1: Original Dataset (BEST ✓)
- **Dataset**: `model1_description_to_part1.jsonl` (26 entries)
- **Tokenization**: `tokenized_model1_qwen` (15 entries after 80/20 split)
- **Training**: 8 rounds
- **Result**: eval_loss=1.2590, perplexity=3.5219
- **Inference Issues**: Missing Backlog (good!), incomplete timeline (2-3 weeks found)
- **Status**: **BEST BASELINE**

### Experiment 2: Strict Augmented Dataset (WORSE ✗)
- **Dataset**: `model1_description_to_part1_strict.jsonl` (26 entries with long system prompt prepended)
- **Tokenization**: `tokenized_model1_qwen_strict` (26 entries after 80/20 split)
- **Training**: 8 rounds
- **Result**: eval_loss=1.5975, perplexity=4.9408
- **Inference Issues**: 
  - Including Status section (FAIL)
  - Including Backlog section (FAIL)
  - Including Proposal/Input section (FAIL)
  - Only 2-3 weeks in timeline
  - Malformed timeline with "Month 1", "Weekends", etc.
- **Status**: **DO NOT USE - Model learned to repeat instruction text instead of follow it**

## Key Finding
Adding long system prompts to training data **confused the small model** and caused it to:
- Learn the prompt text as part of the training pattern
- Repeat instruction content in responses
- Generate forbidden sections (Status, Backlog, Proposal/Input)
- Failed stricter constraints rather than following them

## Recommended Strategy Going Forward

### 1. **Revert to Original Model** (Experiment 1)
   - Use `tokenized_model1_qwen` for retraining
   - Original training was better in terms of loss/perplexity
   - Model was closer to 4 weeks in timeline

### 2. **Focus on Inference-Time Improvements** (not training augmentation)
   - Use carefully crafted short inference prompts
   - Add post-processing to:
     - Strip unwanted sections (Status, Backlog, Proposal/Input)
     - Validate week count and reformat timeline if needed
     - Ensure exactly 4 weeks are present
   - Use constraint-based output formatting

###  3. **Alternative: Section-by-Section Generation** (if needed)
   - Generate each section separately for better control
   - Combine validated sections into final output
   - Higher latency but better compliance guarantee

### 4. **Model Size Consideration**
   - Qwen2-0.5B is very small (500M parameters)
   - Large/verbose prompts may overwhelm model's capacity
   - Concise, clear instructions work better
   - Consider larger model if needs to handle complexity

## Implementation Next Steps

1. **Retrain** with original dataset to restore baseline
2. **Create inference wrapper** with post-processing guards
3. **Test** with actual dataset entries (2-3 samples)
4. **Deploy** with post-processing to ensure compliance

## Timeline Contract (for reference)
```
Required: Exactly 4 weeks, each with 2 tasks
Format: "Week 1: task1, task2"

Good example:
Timeline:
Week 1: Setup database, Create API skeleton
Week 2: Implement endpoints, Add authentication
Week 3: Frontend development, Testing
Week 4: Deployment, Documentation

Bad example (currently generating):
Timeline:
Week 1: Backend Development
Week 2: Frontend Development
[missing weeks 3-4, malformed format]
```

## Decision
✓ **Use original dataset** for retraining
✗ **Skip strict augmentation** - doesn't work with small models
✓ **Add post-processing** at inference time instead
