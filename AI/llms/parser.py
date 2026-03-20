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
    cleaned = cleaned.replace("\u2013", "-").replace("\u2014", "-").replace("\u2022", "-")
    cleaned = re.sub(r"^\s*\*\s*", "- ", cleaned, flags=re.MULTILINE)
    return cleaned.strip()

def parse_summary(raw: str) -> str:
    text = clean_yaml(raw)
    m = re.search(r"(?ims)^\s*Summary\s*:\s*([\s\S]*?)(?=^\s*Roles\s*:|^\s*Features\s*:|^\s*Goals\s*:|^\s*Timeline\s*:|\Z)", text)
    return m.group(1).strip() if m else text.strip().removeprefix("summary:").strip()

def parse_features(raw: str) -> list:
    text = clean_yaml(raw)
    m = re.search(r"(?ims)^\s*Features\s*:\s*([\s\S]*?)(?=^\s*Goals\s*:|^\s*Timeline\s*:|\Z)", text)
    block = m.group(1) if m else text
    features = []
    for line in block.splitlines():
        clean = re.sub(r"^\s*[-*+\d\.)\s]+", "", line).strip()
        if clean:
            features.append(re.sub(r"^\(Optional:\)\s*", "", clean))
    return features[:10]

def parse_roles(raw: str) -> list:
    text = clean_yaml(raw)
    m = re.search(r"(?ims)^\s*Roles\s*:\s*([\s\S]*?)(?=^\s*Features\s*:|^\s*Goals\s*:|^\s*Timeline\s*:|\Z)", text)
    block = m.group(1) if m else text

    lines = [line.strip() for line in block.splitlines()]
    lines = [line for line in lines if line and "<" not in line]
    titles_seen = set()
    roles = []
    for line in lines:
        title = re.sub(r"^[-*+\d\.)\s]+", "", line).strip()
        if not title:
            continue
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
    text = clean_yaml(raw)
    m = re.search(r"(?ims)^\s*Goals\s*:\s*([\s\S]*?)(?=^\s*Timeline\s*:|\Z)", text)
    block = m.group(1) if m else text
    tasks = []
    for line in block.splitlines():
        title = re.sub(r"^\s*[-*+\d\.)\s]+", "", line).strip()
        if title:
            tasks.append({"title": title, "role": ""})
    return tasks[:20]

def parse_timeline(raw: str) -> list:
    cleaned = clean_yaml(raw)
    weeks = []
    for week, body in re.findall(r"(?im)^\s*Week\s*(\d+)\s*:\s*(.+)$", cleaned):
        goals = [g.strip() for g in body.split(",") if g.strip()]
        weeks.append({"week_number": int(week), "goals": goals[:2]})
    return sorted(weeks, key=lambda x: x["week_number"])[:4]