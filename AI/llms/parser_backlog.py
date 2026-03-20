import re

def parse_backlog(raw: str) -> list:
    """Parse plain-text backlog hierarchy into list-of-dicts structure."""
    text = (raw or "").replace("\u2013", "-").replace("\u2014", "-").replace("\u2022", "-")
    lines = [ln.rstrip() for ln in text.splitlines() if ln.strip()]

    epics = []
    current_epic = None
    current_sub = None

    for line in lines:
        stripped = line.strip()

        epic_m = re.match(r"^[-*+\s]*Epic\s*\d+\s*:\s*(.+)$", stripped, flags=re.IGNORECASE)
        if epic_m:
            current_epic = {"epic": epic_m.group(1).strip(), "sub_epics": []}
            epics.append(current_epic)
            current_sub = None
            continue

        sub_m = re.match(r"^[-*+\s]*Sub\s*-?\s*Epic\s*\d*\s*:\s*(.+)$", stripped, flags=re.IGNORECASE)
        if sub_m and current_epic is not None:
            current_sub = {"title": sub_m.group(1).strip(), "user_stories": []}
            current_epic["sub_epics"].append(current_sub)
            continue

        story_m = re.match(r"^[-*+\s]*User\s*Story\s*\d*\s*:\s*(.+)$", stripped, flags=re.IGNORECASE)
        if story_m and current_sub is not None:
            current_sub["user_stories"].append(story_m.group(1).strip())

    return epics