import yaml

def parse_backlog(raw: str) -> list:
    """
    Parses a hierarchical backlog YAML string into structured Python objects.

    Returns:
        List of epics, each with sub-epics and user stories.
    """
    try:
        parsed = yaml.safe_load(raw.strip())
        if not isinstance(parsed, dict) or "backlog" not in parsed:
            return []

        backlog = parsed["backlog"]
        structured = []

        for epic in backlog:
            epic_title = epic.get("epic", "").strip()
            sub_epics_raw = epic.get("sub_epics", [])
            sub_epics = []

            for sub in sub_epics_raw:
                sub_title = sub.get("title", "").strip()
                stories_raw = sub.get("user_stories", [])
                stories = [s.strip() for s in stories_raw if isinstance(s, str) and s.strip().startswith("As a ")]

                sub_epics.append({
                    "title": sub_title,
                    "user_stories": stories
                })

            structured.append({
                "epic": epic_title,
                "sub_epics": sub_epics
            })

        return structured

    except Exception as e:
        print(f"⚠️ Backlog parsing failed: {e}")
        return []