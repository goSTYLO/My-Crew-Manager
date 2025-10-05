from LLMs.backlog_llm import run_backlog_pipeline
from projects.models import Project, Goal, Feature
from backlog.models import Backlog, Epic, SubEpic, UserStory, Task

def ingest_backlog(project: Project) -> Backlog:
    # 🧠 Validate required fields
    if not project.proposal or not project.proposal.parsed_text:
        raise ValueError("Missing parsed proposal text")

    if not project.title or not project.summary:
        raise ValueError("Missing project title or summary")

    # 🧠 Build ProjectModel for LLM
    project_model = {
        "title": project.title,
        "summary": project.summary,
        "tasks": [goal.title for goal in project.goals.all()],
        "features": [feature.title for feature in project.features.all()]
    }

    # 🚀 Run LLM pipeline
    final_model = run_backlog_pipeline(
        llm=None,  # Assume model is loaded inside backlog_llm
        proposal_text=project.proposal.parsed_text,
        project_model=project_model
    )

    # 🧼 Clean existing AI-generated backlog
    backlog, _ = Backlog.objects.get_or_create(project=project)
    backlog.epics.filter(ai=True).delete()

    # 📦 Persist new backlog
    for epic_model in final_model.epics:
        epic = Epic.objects.create(
            backlog=backlog,
            title=epic_model.title,
            description=epic_model.description,
            ai=True
        )

        for sub_epic_model in epic_model.sub_epics:
            sub_epic = SubEpic.objects.create(
                epic=epic,
                title=sub_epic_model.title,
                description=sub_epic_model.description,
                ai=True
            )

            for story_model in sub_epic_model.user_stories:
                story = UserStory.objects.create(
                    sub_epic=sub_epic,
                    title=story_model.title,
                    description=story_model.description,
                    acceptance_criteria=story_model.acceptance_criteria,
                    ai=True
                )

                for task_model in story_model.tasks:
                    # Optional: match goal by title
                    matched_goal = Goal.objects.filter(
                        project=project,
                        title__icontains=task_model.title
                    ).first()

                    Task.objects.create(
                        story=story,
                        goal=matched_goal,
                        title=task_model.title,
                        ai=True
                    )

    return backlog