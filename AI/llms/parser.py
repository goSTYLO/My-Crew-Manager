import yaml
import re

CORE_ROLES = {
    "Project Manager",
    "UI/UX Designer",
    "Frontend Developer",
    "Backend Developer",
    "Quality Assurance Engineer",
}

def clean_yaml(raw: str) -> str:
    lines = [line for line in raw.splitlines() if "<" not in line]
    cleaned = "\n".join(lines)

    # Normalize indentation for timeline blocks
    cleaned = re.sub(r"^( {3,})", "  ", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^(\s*)tasks:", "    tasks:", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^(\s*)- (?=\w)", "      - ", cleaned, flags=re.MULTILINE)

    return cleaned

def parse_summary(raw: str) -> str:
    return raw.strip().removeprefix("summary:").strip()

def parse_features(raw: str) -> list:
    lines = [line.strip() for line in raw.strip().splitlines()]
    lines = [line for line in lines if line.startswith("- ") and "<" not in line]

    # Strip optional labels
    features = [re.sub(r"^\(Optional:\)\s*", "", line[2:].strip()) for line in lines]
    return features[:5]

def parse_roles(raw: str) -> list:
    # Slice first valid block
    blocks = raw.split("roles:")
    if len(blocks) > 1:
        raw = "roles:" + blocks[1]

    lines = [line.strip() for line in raw.strip().splitlines()]
    lines = [line for line in lines if line.startswith("- ") and "<" not in line]
    titles_seen = set()
    roles = []
    for line in lines:
        title = line[2:].strip()
        key = title.casefold()
        if key in titles_seen:
            continue
        titles_seen.add(key)
        roles.append({"title": title})

    # Ensure core roles are present
    titles = {r["title"] for r in roles}
    for core in CORE_ROLES:
        if core not in titles:
            roles.insert(0, {"title": core})

    # Deduplicate again after inserting cores
    deduped = []
    seen = set()
    for r in roles:
        key = r["title"].casefold()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    return deduped[:8]

def parse_tasks(raw: str) -> list:
    lines = [line.strip() for line in raw.strip().splitlines()]
    lines = [line for line in lines if "<" not in line]

    tasks = []
    current = {}
    for line in lines:
        if line.startswith("- title:"):
            if "title" in current and "role" in current:
                tasks.append(current)
            current = {"title": line.split(":", 1)[1].strip()}
        elif line.startswith("role:"):
            current["role"] = line.split(":", 1)[1].strip()
    if "title" in current and "role" in current:
        tasks.append(current)

    return tasks[:8]

def parse_timeline(raw: str) -> list:
    try:
        cleaned = clean_yaml(raw)
        parsed = yaml.safe_load(cleaned)
        return parsed.get("timeline", []) if isinstance(parsed, dict) else []
    except Exception as e:
        print(f"⚠️ Timeline parsing failed: {e}")
        return []