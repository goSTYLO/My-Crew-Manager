"""
Generate synthetic training examples using a cloud LLM (Gemini, GPT-4, Claude).
Set GOOGLE_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in .env. Run from AI/ directory.

Two-model pipeline: GPT-4 generates combined JSON (description, part1_output, part2_output)
in one call per entry, then we split into:
  - model1_description_to_part1.jsonl: description -> Part 1 JSON (summary, roles, features, goals, timeline)
  - model2_part1_to_backlog.jsonl: Part 1 JSON -> backlog text (Epic/Sub-Epic/User Story/Task format)

Usage:
  cd AI && python -m llms.fine_tune.build_synthetic           # count from SYNTHETIC_DEFAULT_COUNT in .env
  python -m llms.fine_tune.build_synthetic --count 100      # override count
  python -m llms.fine_tune.build_synthetic --overwrite      # replace existing JSONL

  Env: GOOGLE_API_KEY, SYNTHETIC_DEFAULT_COUNT (default 100), SYNTHETIC_MODEL (first model to try)
"""
from pathlib import Path

# Load .env before imports that read env vars
_AI_ROOT = Path(__file__).resolve().parent.parent.parent
try:
    from dotenv import load_dotenv
    load_dotenv(_AI_ROOT / ".env")
    load_dotenv(_AI_ROOT.parent / ".env")
except ImportError:
    pass

import argparse
import json
import os
import random
import re
import time

# Paths
_SCRIPT_DIR = Path(__file__).resolve().parent
PROMPTS_DIR = _SCRIPT_DIR.parent / "prompts"
DATASET_DIR = _SCRIPT_DIR / "dataset"

# Gemini model fallback chain (try next on 429 rate limit)
GEMINI_MODEL_FALLBACKS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
]

# Proposal types for diversity
PROPOSAL_TYPES = [
    "task management",
    "inventory system",
    "customer portal",
    "API platform",
    "mobile fitness app",
    "internal HR tool",
    "e-commerce backend",
    "analytics dashboard",
    "document management",
    "event booking system",
    "support ticketing",
    "resource scheduling",
    "CRM",
    "API gateway",
    "internal dashboard",
]


def _validate_backlog_format(response: str) -> bool:
    """Validate backlog has Epic, Sub-Epic, User Story, Task structure."""
    if not response or not isinstance(response, str):
        return False
    r = response.lower().strip()
    has_epic = "epic" in r and ":" in response
    has_task = "-task" in r or "task" in r
    lines = response.splitlines()
    epic_count = sum(1 for line in lines if line.strip().lower().startswith("epic") and ":" in line)
    task_count = sum(1 for line in lines if line.strip().lower().startswith("-task") and ":" in line)
    return has_epic and has_task and epic_count >= 4 and task_count > 0


def _validate_part1(part1: dict) -> bool:
    """Validate Part 1 structure: summary, roles, features, goals, timeline."""
    if not isinstance(part1, dict):
        return False
    if not part1.get("summary") or not isinstance(part1["summary"], str):
        return False
    if not part1.get("roles") or not isinstance(part1["roles"], list):
        return False
    if not part1.get("features") or not isinstance(part1["features"], list):
        return False
    if not part1.get("goals") or not isinstance(part1["goals"], list):
        return False
    for g in part1["goals"]:
        if not isinstance(g, dict) or "epic" not in g or "role" not in g:
            return False
    if not part1.get("timeline") or not isinstance(part1["timeline"], dict):
        return False
    return True


class RateLimitError(Exception):
    """Raised when API returns 429 / RESOURCE_EXHAUSTED."""


def _call_llm(
    client,
    model: str,
    user_content: str,
    system_content: str | None = None,
    max_tokens: int = 2048,
) -> str | None:
    """Call Gemini, OpenAI, or Anthropic and return response text. Raises RateLimitError on 429."""
    try:
        # Google Gemini (google.genai SDK - client.models.generate_content)
        if hasattr(client, "models") and hasattr(client.models, "generate_content"):
            from google.genai import types
            from google.genai.errors import ClientError
            config = types.GenerateContentConfig(
                system_instruction=system_content or "",
                max_output_tokens=max_tokens,
            )
            try:
                resp = client.models.generate_content(
                    model=model,
                    contents=user_content,
                    config=config,
                )
            except ClientError as e:
                if getattr(e, "status_code", None) == 429 or "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    raise RateLimitError(f"Rate limit exceeded for {model}") from e
                raise
            if resp and resp.text:
                return resp.text.strip()
            return None
        # OpenAI
        if hasattr(client, "chat") and hasattr(client.chat, "completions"):
            msgs = [{"role": "user", "content": user_content}]
            if system_content:
                msgs = [{"role": "system", "content": system_content}, *msgs]
            resp = client.chat.completions.create(
                model=model,
                messages=msgs,
                max_tokens=max_tokens,
            )
            return (resp.choices[0].message.content or "").strip()
        # Anthropic
        msgs = [{"role": "user", "content": user_content}]
        kwargs = {"model": model, "max_tokens": max_tokens, "messages": msgs}
        if system_content:
            kwargs["system"] = system_content
        resp = client.messages.create(**kwargs)
        return (resp.content[0].text or "").strip()
    except RateLimitError:
        raise
    except Exception as e:
        print(f"  API error: {e}")
        return None


def _extract_json_from_response(text: str) -> dict | None:
    """Extract JSON from LLM response (handles markdown code blocks)."""
    text = (text or "").strip()
    # Try to find JSON in markdown code block
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find outermost {...}
        start = text.find("{")
        if start >= 0:
            depth = 0
            for i in range(start, len(text)):
                if text[i] == "{":
                    depth += 1
                elif text[i] == "}":
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start : i + 1])
                        except json.JSONDecodeError:
                            break
    return None


SYSTEM_PROMPT = """You are a software project planning assistant. For each raw project description, produce a structured JSON with three parts:

1. description: The raw input paragraph (keep as-is or slightly cleaned).
2. part1_output: Structured proposal with:
   - summary: 2-3 sentence summary
   - roles: array of role strings (e.g. ["Project Manager", "Backend Developer"])
   - features: array of feature strings (e.g. ["API", "Dashboard"])
   - goals: array of {epic: "...", role: "..."} - each goal is an epic linked to a role
   - timeline: object with week1, week2, week3, week4 (or week5) - each value is an array of task strings

3. part2_output: A PLAIN TEXT backlog (NOT JSON) in this exact format:
Epic 1: <Title> *(covers: <Goal from part1>)*
 -Sub-Epic 1.1: <Sub-Epic Title>
  -User Story 1.1.1: As a <role>, I need <capability>
   -Task 1.1.1.1: <Task description>
   -Task 1.1.1.2: <Task description>
Epic 2: ...

Requirements for part2_output:
- Minimum 4 epics, each covering a goal from part1
- Each Epic has exactly 1 Sub-Epic, 1 User Story, 2 Tasks
- Use Epic X:, -Sub-Epic X.1:, -User Story X.1.1:, -Task X.1.1.1: format
- Output ONLY the backlog text for part2_output, no JSON wrapper

Respond with a single JSON object: {"description": "...", "part1_output": {...}, "part2_output": "Epic 1: ...\\n ..."}
"""


def generate_one_entry(
    client,
    models: str | list[str],
    domain: str,
    max_retries: int = 2,
    used_model_out: list | None = None,
) -> dict | None:
    """Generate one combined entry. For Gemini, models is a list tried in order on RateLimitError."""
    models_list = [models] if isinstance(models, str) else models
    user = f"Generate a software project for domain: {domain}. Include a 2-3 paragraph description, then produce part1_output and part2_output."

    for model in models_list:
        for attempt in range(max_retries + 1):
            if attempt > 0:
                time.sleep(0.5)
            try:
                resp = _call_llm(client, model, user, SYSTEM_PROMPT, max_tokens=2048)
            except RateLimitError:
                print(f"  Rate limit on {model}, trying next model...")
                break
            if not resp:
                continue
            data = _extract_json_from_response(resp)
            if not data:
                continue
            desc = data.get("description")
            part1 = data.get("part1_output")
            part2 = data.get("part2_output")
            if not desc or not part1 or not part2:
                continue
            if not _validate_part1(part1):
                continue
            if not _validate_backlog_format(part2):
                continue
            if used_model_out is not None:
                used_model_out.append(model)
            return {"description": desc, "part1_output": part1, "part2_output": part2}
    return None




def split_and_write(entries: list[dict]) -> tuple[int, int]:
    """Split combined entries into model1 and model2 JSONL files. Returns (count1, count2)."""
    model1_path = DATASET_DIR / "model1_description_to_part1.jsonl"
    model2_path = DATASET_DIR / "model2_part1_to_backlog.jsonl"
    combined_path = DATASET_DIR / "combined.json"

    count1 = 0
    count2 = 0
    for ent in entries:
        prompt1 = ent["description"]
        response1 = json.dumps(ent["part1_output"], ensure_ascii=False)
        prompt2 = response1
        response2 = ent["part2_output"]

        with open(model1_path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"prompt": prompt1, "response": response1}, ensure_ascii=False) + "\n")
        count1 += 1

        with open(model2_path, "a", encoding="utf-8") as f:
            f.write(json.dumps({"prompt": prompt2, "response": response2}, ensure_ascii=False) + "\n")
        count2 += 1

    combined_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    return count1, count2


def main(count: int | None = None, overwrite: bool = False, model: str | None = None):
    """Generate combined dataset and split into model1/model2 JSONL."""
    model_id = model or os.getenv("SYNTHETIC_MODEL")
    if count is None:
        try:
            count = int(os.getenv("SYNTHETIC_DEFAULT_COUNT", "20"))
        except ValueError:
            count = 20

    client = None
    request_delay = 0.5
    models_arg = None
    if os.getenv("GOOGLE_API_KEY"):
        try:
            from google import genai
            client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
            first_model = model_id or os.getenv("SYNTHETIC_MODEL") or GEMINI_MODEL_FALLBACKS[0]
            model_ids = [first_model]
            for m in GEMINI_MODEL_FALLBACKS:
                if m not in model_ids:
                    model_ids.append(m)
            models_arg = model_ids
            request_delay = 13  # Gemini free tier: ~5–15 req/min; 13 sec between requests
            print(f"Using Gemini with fallbacks: {model_ids}, rate-limited (13 s delay)")
        except ImportError:
            print("Install google-genai: pip install google-genai")
            return
    elif os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI
            client = OpenAI()
            model_id = model_id or os.getenv("SYNTHETIC_MODEL", "gpt-4o-mini")
            models_arg = model_id
            print(f"Using OpenAI ({model_id})")
        except ImportError:
            print("Install openai: pip install openai")
            return
    elif os.getenv("ANTHROPIC_API_KEY"):
        try:
            from anthropic import Anthropic
            client = Anthropic()
            model_id = model_id or os.getenv("SYNTHETIC_MODEL", "claude-sonnet-4-20250514")
            models_arg = model_id
            print(f"Using Anthropic ({model_id})")
        except ImportError:
            print("Install anthropic: pip install anthropic")
            return
    else:
        print("Set GOOGLE_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in .env")
        return

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    (DATASET_DIR / "raw").mkdir(parents=True, exist_ok=True)

    if overwrite:
        for name in ["model1_description_to_part1", "model2_part1_to_backlog"]:
            p = DATASET_DIR / f"{name}.jsonl"
            if p.exists():
                p.write_text("", encoding="utf-8")
        print("Overwrote existing JSONL files.")

    print(f"Generating {count} combined entries (description + part1 + part2)...")
    entries = []
    for i in range(count):
        domain = random.choice(PROPOSAL_TYPES)
        ent = generate_one_entry(client, models_arg, domain)
        if ent:
            entries.append(ent)
            print(f"  Entry {len(entries)}/{count} (domain: {domain})")
        if i < count - 1:
            time.sleep(request_delay)

    if not entries:
        print("No entries generated.")
        return

    print("Splitting into model1 and model2 JSONL...")
    c1, c2 = split_and_write(entries)
    print("Done.")
    print(f"  model1_description_to_part1.jsonl: {c1} examples")
    print(f"  model2_part1_to_backlog.jsonl: {c2} examples")
    print(f"  combined.json: {len(entries)} entries")


def run():
    """Entry point for script invocation."""
    default_count = 20
    try:
        default_count = int(os.getenv("SYNTHETIC_DEFAULT_COUNT", "20"))
    except ValueError:
        pass
    parser = argparse.ArgumentParser(description="Generate synthetic training dataset (two-model pipeline)")
    parser.add_argument("--count", type=int, default=None, help=f"Number of entries (default from SYNTHETIC_DEFAULT_COUNT in .env, or {default_count})")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing JSONL files")
    parser.add_argument("--model", type=str, default=None, help="Model ID (or SYNTHETIC_MODEL env)")
    args = parser.parse_args()
    count = args.count if args.count is not None else default_count
    main(count=count, overwrite=args.overwrite, model=args.model)


if __name__ == "__main__":
    import sys
    ai_root = _SCRIPT_DIR.parent.parent
    if str(ai_root) not in sys.path:
        sys.path.insert(0, str(ai_root))
    run()
