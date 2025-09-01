import yaml

def parse_summary(raw: str) -> str:
    return raw.strip().removeprefix("summary:").strip()

def parse_roles(raw: str) -> list:
    lines = raw.strip().splitlines()
    roles = []
    current = {}
    for line in lines:
        line = line.strip()
        if line.startswith("- "):
            if current:
                roles.append(current)
            current = {"title": line[2:].strip()}
        elif line.startswith("description:"):
            current["description"] = line.split(":", 1)[1].strip()
    if current:
        roles.append(current)
    return roles

def parse_tasks(raw: str) -> list:
    lines = raw.strip().splitlines()
    tasks = []
    current = {}
    roles = []
    for line in lines:
        line = line.strip()
        if line.startswith("- title:"):
            if current and roles:
                for role in roles:
                    tasks.append({"title": current["title"], "role": role})
            current = {"title": line.split(":", 1)[1].strip()}
            roles = []
        elif line.startswith("role:"):
            roles.append(line.split(":", 1)[1].strip())
    if current and roles:
        for role in roles:
            tasks.append({"title": current["title"], "role": role})
    return tasks

def parse_timeline(raw: str) -> list:
    import yaml
    try:
        parsed = yaml.safe_load(raw.strip())
        return parsed.get("timeline", []) if isinstance(parsed, dict) else []
    except Exception:
        return []

def parse_risks(raw: str) -> list:
    try:
        parsed = yaml.safe_load(raw)
        return parsed.get("risks", []) if isinstance(parsed, dict) else []
    except Exception:
        return []