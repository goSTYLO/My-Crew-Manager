from LLMs.project_llm import run_pipeline_from_text, model_to_dict
from projects.models import Project, Member, Feature, Goal
from sprints.serializers import SprintSerializer

def ingest_proposal(text: str, user=None, title: str = "", existing_project: Project = None) -> Project:
    # 🔍 Run the LLM pipeline
    project_model = run_pipeline_from_text(text)
    project_data = model_to_dict(project_model)

    # 🧠 Use existing project or create new one
    project = existing_project or Project.objects.create(
        title=title or project_model.title or "",
        summary=project_model.summary,
        ai=True,
        created_by=user if user and user.is_authenticated else None
    )

    # 🧼 Clean existing AI-generated data
    project.members.filter(ai=True).delete()
    project.features.filter(ai=True).delete()
    project.goals.filter(ai=True).delete()
    project.sprints.filter(ai=True).delete()

    # 🧠 Update project fields
    project.title = title or project.title
    project.summary = project_model.summary
    project.ai = True
    project.save()

    # 👥 Create Members
    for role in project_model.roles:
        try:
            Member.objects.create(
                project=project,
                role=role.role,
                ai=True
            )
        except Exception as e:
            print(f"❌ Member creation failed: {e}")

    # ✨ Create Features
    for feature in project_model.features:
        try:
            Feature.objects.create(
                project=project,
                title=feature,
                description="",
                ai=True
            )
        except Exception as e:
            print(f"❌ Feature creation failed: {e}")

    # 🎯 Create Goals (with role enrichment)
    for goal in project_model.goals:
        try:
            Goal.objects.create(
                project=project,
                title=goal["title"],
                description="",
                role=goal.get("role", ""),
                ai=True
            )
        except Exception as e:
            print(f"❌ Goal creation failed: {e}")

    # 🗓️ Create Sprints (now using goals instead of tasks)
    for week in project_model.timeline:
        sprint_data = {
            "project": project.id,
            "week_number": week.week_number,
            "ai": True,
            "goals": [{"title": goal.title, "ai": True} for goal in week.goals]
        }
        sprint_serializer = SprintSerializer(data=sprint_data)
        if sprint_serializer.is_valid():
            sprint_serializer.save()
        else:
            print(f"❌ Sprint validation failed: {sprint_serializer.errors}")

    # ✅ Log output
    print(f"\n✅ LLM Output Ingested:\nTitle: {project.title}\nSummary: {project.summary}")
    print(f"👥 Roles stored: {project.members.filter(ai=True).count()}")
    print(f"🎯 Goals stored: {project.goals.filter(ai=True).count()}")
    print(f"✨ Features stored: {project.features.filter(ai=True).count()}")
    print(f"🗓️ Sprints stored: {project.sprints.filter(ai=True).count()}")

    return project