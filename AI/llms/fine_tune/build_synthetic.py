"""
Generate synthetic training examples using a cloud LLM (GPT-4, Claude).
Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env. Run from AI/ directory.

Generates proposals via LLM, then produces all 6 sections (summary, features, roles,
goals, timeline, backlog) in dependency order with validated outputs.

Usage:
  cd AI && python -m llms.fine_tune.build_synthetic --count 15
  python -m llms.fine_tune.build_synthetic --count 20 --overwrite
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
PROMPTS_DIR = _SCRIPT_DIR.parent / "prompts"  # llms/prompts
DATASET_DIR = _SCRIPT_DIR / "dataset"

# Proposal types for diversity (moderate realism)
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


def _validate_section_format(section: str, response: str) -> bool:
    """Mirror of project_llm.validate_section_format."""
    if not response or not isinstance(response, str):
        return False
    r = response.lower().strip()
    if section == "summary":
        return r.startswith("summary:")
    if section == "features":
        return r.startswith("features:") and "- " in r
    if section == "roles":
        return r.startswith("roles:") and "- " in r
    if section == "goals":
        return "- title:" in r and "role:" in r
    if section == "timeline":
        return "timeline:" in r and "week_number:" in r
    return True


def _validate_backlog_format(response: str) -> bool:
    """Mirror of backlog_llm.validate_backlog_format."""
    if not response or not isinstance(response, str):
        return False
    r = response.lower().strip()
    has_epic = "epic" in r and ":" in response
    has_task = "-task" in r or "task" in r
    lines = response.splitlines()
    epic_count = sum(1 for line in lines if line.strip().lower().startswith("epic") and ":" in line)
    task_count = sum(1 for line in lines if line.strip().lower().startswith("-task") and ":" in line)
    return has_epic and has_task and epic_count >= 4 and task_count > 0


def _load_template(section: str) -> str:
    """Load prompt template for a section."""
    path = PROMPTS_DIR / f"{section}_prompt.txt"
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def _build_prompt(section: str, proposal_text: str, context: dict | None = None) -> str:
    """Build prompt from template with placeholders filled."""
    template = _load_template(section)
    if not template:
        return ""
    prompt = template.replace("{proposal_text}", proposal_text)
    if context:
        for k, v in context.items():
            prompt = prompt.replace(f"{{{k}}}", str(v).strip())
    prompt = re.sub(r"{\w+}", "", prompt)
    return prompt


def _extract_project_title(summary: str) -> str:
    """Extract project title from summary (first sentence)."""
    match = re.match(r"summary:\s*(.*?)(?:\.|$)", summary, re.DOTALL | re.IGNORECASE)
    if match:
        first = match.group(1).strip()
        sent = re.match(r"^(.*?\.)", first)
        return sent.group(1).strip() if sent else first[:50]
    return "Project from Proposal"


def _extract_goal_titles(goals: str) -> str:
    """Extract goal titles from goals output."""
    titles = []
    for line in goals.splitlines():
        line = line.strip()
        if line.startswith("- title:"):
            titles.append(line[len("- title:"):].strip())
    return "\n".join(f"- title: {t}" for t in titles)


def _extract_features_list(features: str) -> str:
    """Extract feature bullets as comma-separated for backlog context."""
    items = []
    for line in features.splitlines():
        line = line.strip()
        if line.startswith("- "):
            items.append(line[2:].strip())
    return ", ".join(items[:6])


def _call_llm(client, model: str, user_content: str, system_content: str | None = None, max_tokens: int = 512) -> str | None:
    """Call OpenAI or Anthropic and return response text."""
    try:
        if hasattr(client, "chat") and hasattr(client.chat, "completions"):
            # OpenAI
            msgs = [{"role": "user", "content": user_content}]
            if system_content:
                msgs = [{"role": "system", "content": system_content}, *msgs]
            resp = client.chat.completions.create(
                model=model,
                messages=msgs,
                max_tokens=max_tokens,
            )
            return (resp.choices[0].message.content or "").strip()
        else:
            # Anthropic
            msgs = [{"role": "user", "content": user_content}]
            kwargs = {"model": model, "max_tokens": max_tokens, "messages": msgs}
            if system_content:
                kwargs["system"] = system_content
            resp = client.messages.create(**kwargs)
            return (resp.content[0].text or "").strip()
    except Exception as e:
        print(f"  API error: {e}")
        return None


def generate_proposals(client, count: int, model: str) -> list[str]:
    """Generate N software project proposals via cloud LLM."""
    system = (
        "You write realistic software project proposals for planning tools. "
        "Domain-relevant: SaaS, internal tools, mobile apps, APIs. "
        "Include: project goal, 3-6 features, team composition (PM, devs, QA, etc.), timeline (e.g. 6-12 weeks). "
        "2-3 paragraphs. No markdown."
    )
    proposals = []
    for i in range(count):
        domain = random.choice(PROPOSAL_TYPES)
        user = f"Write a unique software project proposal. Domain: {domain}."
        resp = _call_llm(client, model, user, system, max_tokens=400)
        if resp:
            proposals.append(resp)
            print(f"  Generated proposal {i+1}/{count}")
        time.sleep(0.5)
    return proposals


def generate_section_example(
    client,
    section: str,
    proposal_text: str,
    context: dict | None,
    model: str,
    max_retries: int = 2,
    max_tokens: int = 768,
) -> dict | None:
    """Generate one prompt-response pair for a section, with validation."""
    prompt = _build_prompt(section, proposal_text, context)
    if not prompt:
        return None
    for attempt in range(max_retries + 1):
        resp = _call_llm(client, model, prompt, max_tokens=max_tokens)
        if not resp:
            continue
        if section == "backlog":
            valid = _validate_backlog_format(resp)
        else:
            valid = _validate_section_format(section, resp)
        if valid:
            return {"prompt": prompt, "response": resp}
        if attempt < max_retries:
            time.sleep(0.3)
    return None


def run_pipeline(client, proposal: str, model: str) -> dict[str, dict]:
    """Generate all 6 sections for one proposal in dependency order."""
    results = {}
    raw = {}

    # 1. Summary
    ex = generate_section_example(client, "summary", proposal, None, model, max_tokens=256)
    if ex:
        raw["summary"] = ex["response"]
        results["summary"] = ex

    # 2. Features
    ex = generate_section_example(client, "features", proposal, None, model, max_tokens=256)
    if ex:
        raw["features"] = ex["response"]
        results["features"] = ex

    # 3. Roles
    ex = generate_section_example(client, "roles", proposal, None, model, max_tokens=256)
    if ex:
        raw["roles"] = ex["response"]
        results["roles"] = ex

    # 4. Goals (needs roles)
    if "roles" in raw:
        roles = raw["roles"]
        role_lines = [l.strip()[2:] for l in roles.splitlines() if l.strip().startswith("- ")]
        core = ["Project Manager", "Frontend Developer", "Backend Developer", "Quality Assurance Engineer", "UI/UX Designer"]
        extra = [r for r in role_lines if r not in core][:3]
        context = {"roles": roles, "additional_roles": ", ".join(extra) if extra else "DevOps Engineer, Data Engineer"}
        ex = generate_section_example(client, "goals", proposal, context, model, max_tokens=384)
        if ex:
            raw["goals"] = ex["response"]
            results["goals"] = ex

    # 5. Timeline (needs goals)
    if "goals" in raw:
        goals_context = {"goals": _extract_goal_titles(raw["goals"])}
        ex = generate_section_example(client, "timeline", proposal, goals_context, model, max_tokens=384)
        if ex:
            raw["timeline"] = ex["response"]
            results["timeline"] = ex

    # 6. Backlog (needs project_title, features, tasks from overview)
    if "summary" in raw and "features" in raw and "goals" in raw:
        project_title = _extract_project_title(raw["summary"])
        features_str = _extract_features_list(raw["features"])
        tasks_str = _extract_goal_titles(raw["goals"])
        context = {
            "project_title": project_title,
            "features": features_str,
            "tasks": tasks_str,
            "proposal_text": proposal,
        }
        ex = generate_section_example(client, "backlog", proposal, context, model, max_tokens=768)
        if ex:
            results["backlog"] = ex

    return results


def main(count: int = 15, overwrite: bool = False, model: str | None = None):
    """Generate synthetic dataset and write to JSONL files."""
    model = model or os.getenv("SYNTHETIC_MODEL", "gpt-4o-mini")

    client = None
    if os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI
            client = OpenAI()
        except ImportError:
            print("Install openai: pip install openai")
            return
    elif os.getenv("ANTHROPIC_API_KEY"):
        try:
            from anthropic import Anthropic
            client = Anthropic()
        except ImportError:
            print("Install anthropic: pip install anthropic")
            return
    else:
        print("Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env")
        return

    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    (DATASET_DIR / "raw").mkdir(parents=True, exist_ok=True)

    jsonl_files = ["summary", "features", "roles", "goals", "timeline", "backlog"]
    if overwrite:
        for name in jsonl_files:
            p = DATASET_DIR / f"{name}.jsonl"
            if p.exists():
                p.write_text("", encoding="utf-8")
        print("Overwrote existing JSONL files.")

    print(f"Generating {count} proposals...")
    proposals = generate_proposals(client, count, model)
    if not proposals:
        print("No proposals generated.")
        return

    print(f"Processing {len(proposals)} proposals (6 sections each)...")
    counts = {s: 0 for s in jsonl_files}

    for i, proposal in enumerate(proposals):
        print(f"  Proposal {i+1}/{len(proposals)}...")
        results = run_pipeline(client, proposal, model)
        for section, ex in results.items():
            path = DATASET_DIR / f"{section}.jsonl"
            with open(path, "a", encoding="utf-8") as f:
                f.write(json.dumps(ex, ensure_ascii=False) + "\n")
            counts[section] += 1
        time.sleep(0.5)

    print("Done.")
    for s in jsonl_files:
        print(f"  {s}.jsonl: {counts[s]} examples")


def run():
    """Entry point for script invocation."""
    parser = argparse.ArgumentParser(description="Generate synthetic training dataset")
    parser.add_argument("--count", type=int, default=15, help="Number of proposals to generate")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing JSONL files")
    parser.add_argument("--model", type=str, default=None, help="Model ID (or SYNTHETIC_MODEL env)")
    args = parser.parse_args()
    main(count=args.count, overwrite=args.overwrite, model=args.model)


if __name__ == "__main__":
    import sys
    ai_root = _SCRIPT_DIR.parent.parent
    if str(ai_root) not in sys.path:
        sys.path.insert(0, str(ai_root))
    run()
