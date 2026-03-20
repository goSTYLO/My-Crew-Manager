"""
Shared minimal-strict backlog prompt text for TrainModel2_Step6 and production inference.

Keep in sync with notebook expectations: Part 1 + newline + guide (matches microservice default).
No torch/import side effects.
"""


def minimal_strict_guide(expected_epic_count: int) -> str:
    """Short post-prompt rules only (no long examples). Aligns with JSONL line patterns."""
    return (
        "Continue with backlog text only. First line must start with: Epic 1:\n"
        f"Total epics: {expected_epic_count} (same order as Goals).\n"
        "Each epic uses exactly these line types in order (one line each):\n"
        "Epic N: <title from matching goal>\n"
        "-Sub-Epic 1: <short phase label only—a few words like Planning or Build phase; "
        "NOT a sentence, do NOT start with 'User Story', do NOT include 'As a' on this line>\n"
        "-User Story 1: As a <role>, I want <capability> so that <benefit>. "
        "(full user story ONLY on this line)\n"
        "-Task 1: <concrete action>\n"
        "-Task 2: <concrete action>\n"
        "Emit only those line patterns. Do not repeat rules, disclaimers, or "
        "'metadata' lines under each epic.\n"
        "No markdown headers, code fences, pipe tables, * bullets, numbered lists, "
        "Timeline, Tools, Week sections, or extra prose.\n"
        "Stop immediately after the final epic's -Task 2 line.\n"
    )


def minimal_strict_retry_suffix(expected_epic_count: int) -> str:
    """Single recovery line appended after the guide on retry (minimal_strict mode)."""
    return (
        f"RETRY: Epic 1: must use the first Goal title. {expected_epic_count} epics. "
        "-Sub-Epic 1: short label only; full 'As a...' sentence only on -User Story 1:. "
        "Do not repeat instructions after each epic.\n"
    )


def minimal_strict_second_retry_suffix(expected_epic_count: int) -> str:
    """Stronger nudge when the first retry still returns too few epics (minimal_strict mode)."""
    return (
        f"SECOND RETRY: Emit Epic 1: through Epic {expected_epic_count}: in order. "
        "Do not stop after Epic 1. No markdown *, no Note paragraphs, no completion messages. "
        "Exactly six lines per epic (Epic, Sub-Epic, User Story, Task1, Task2).\n"
    )
