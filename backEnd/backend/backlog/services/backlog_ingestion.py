import re
from LLMs.backlog_llm import run_backlog_pipeline
from projects.models import Project, Feature
from backlog.models import Backlog, Epic, SubEpic, UserStory, Task

def ingest_backlog(project: Project) -> Backlog:
    # 🧠 Validate required fields
    if not project.proposal or not project.proposal.parsed_text:
        raise ValueError("Missing parsed proposal text")

    if not project.title or not project.summary:
        raise ValueError("Missing project title or summary")

    # 🧠 Build context for prompt injection
    context = {
        "project_title": project.title,
        "features": ", ".join([f.title for f in project.features.all()]),
        "tasks": "\n".join([g.title for g in project.goals.all()])
    }

    # 🚀 Run LLM pipeline
    final_model = run_backlog_pipeline(
        proposal_text=project.proposal.parsed_text,
        context=context
    )

    # 🧼 Clean existing AI-generated backlog
    backlog, _ = Backlog.objects.get_or_create(project=project)
    backlog.epics.filter(ai=True).delete()

    # 📊 Initialize counters
    stats = {
        "epics": {"success": 0, "error": 0},
        "sub_epics": {"success": 0, "error": 0},
        "stories": {"success": 0, "error": 0},
        "tasks": {"success": 0, "error": 0}
    }

    # 📦 Persist new backlog
    for epic_model in final_model.epics:
        try:
            epic = Epic.objects.create(
                backlog=backlog,
                title=epic_model.title,
                description=epic_model.description or "",
                ai=True
            )
            stats["epics"]["success"] += 1
        except Exception as e:
            print(f"❌ Epic error: {epic_model.title} → {e}")
            stats["epics"]["error"] += 1
            continue

        for sub_epic_model in epic_model.sub_epics:
            try:
                sub_epic = SubEpic.objects.create(
                    epic=epic,
                    title=sub_epic_model.title,
                    description=sub_epic_model.description or "",
                    ai=True
                )
                stats["sub_epics"]["success"] += 1
            except Exception as e:
                print(f"❌ SubEpic error: {sub_epic_model.title} → {e}")
                stats["sub_epics"]["error"] += 1
                continue

            for story_model in sub_epic_model.user_stories:
                try:
                    story = UserStory.objects.create(
                        sub_epic=sub_epic,
                        title=story_model.title,
                        description=story_model.description or "",
                        acceptance_criteria="\n".join(story_model.acceptance_criteria),
                        ai=True
                    )
                    stats["stories"]["success"] += 1
                except Exception as e:
                    print(f"❌ UserStory error: {story_model.title} → {e}")
                    stats["stories"]["error"] += 1
                    continue

                for task_model in story_model.tasks:
                    try:
                        Task.objects.create(
                            story=story,
                            goal=None,
                            title=task_model.title,
                            ai=True
                        )
                        stats["tasks"]["success"] += 1
                    except Exception as e:
                        print(f"❌ Task error: {task_model.title} → {e}")
                        stats["tasks"]["error"] += 1

    # 📊 Final log summary
    print("\n📊 Backlog Ingestion Summary")
    print(f"✅ Epics: {stats['epics']['success']} stored, {stats['epics']['error']} failed")
    print(f"✅ SubEpics: {stats['sub_epics']['success']} stored, {stats['sub_epics']['error']} failed")
    print(f"✅ UserStories: {stats['stories']['success']} stored, {stats['stories']['error']} failed")
    print(f"✅ Tasks: {stats['tasks']['success']} stored, {stats['tasks']['error']} failed")

    return backlog