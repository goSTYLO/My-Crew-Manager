from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from .models import (
    Project, Proposal,
    ProjectFeature, ProjectRole, ProjectGoal,
    TimelineWeek, TimelineItem,
    Epic, SubEpic, UserStory, StoryTask,
)
from .serializers import ProjectSerializer, ProposalSerializer

# Real LLM pipelines
from LLMs.project_llm import run_pipeline_from_text, model_to_dict
from LLMs.backlog_llm import run_backlog_pipeline

import pdfplumber


class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["put"], url_path="ingest-proposal/(?P<proposal_id>[^/.]+)")
    def ingest_proposal(self, request, pk=None, proposal_id=None):
        project = self.get_object()
        proposal = get_object_or_404(Proposal, id=proposal_id, project=project)

        if not proposal.parsed_text:
            return Response({"error": "Proposal has no parsed text"}, status=status.HTTP_400_BAD_REQUEST)

        # Run real LLM pipeline and return structured output
        project_model = run_pipeline_from_text(proposal.parsed_text)
        output = model_to_dict(project_model)

        # Optionally persist minimal fields on our local Project
        title_override = request.data.get("title")
        if title_override:
            output["title"] = title_override
        project.title = output.get("title") or project.title
        project.summary = output.get("summary") or project.summary
        project.save(update_fields=["title", "summary"])

        # Persist features
        ProjectFeature.objects.filter(project=project).delete()
        for feat in output.get("features", [])[:10]:
            ProjectFeature.objects.create(project=project, title=str(feat)[:512])

        # Persist roles
        ProjectRole.objects.filter(project=project).delete()
        for role in output.get("roles", [])[:20]:
            ProjectRole.objects.create(project=project, role=str(role)[:255])

        # Persist goals
        ProjectGoal.objects.filter(project=project).delete()
        for g in output.get("goals", [])[:20]:
            ProjectGoal.objects.create(
                project=project,
                title=str(g.get("title", ""))[:512],
                role=(g.get("role") or "")[:255]
            )

        # Persist timeline
        TimelineWeek.objects.filter(project=project).delete()
        for week in output.get("timeline", [])[:12]:
            tw = TimelineWeek.objects.create(project=project, week_number=int(week.get("week_number", 0) or 0))
            for item in week.get("goals", [])[:20]:
                TimelineItem.objects.create(week=tw, title=str(item)[:512])

        return Response({
            "message": "Project enriched with LLM output",
            "project_id": project.id,
            "llm": output,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["put"], url_path="generate-backlog")
    def generate_backlog(self, request, pk=None):
        project = self.get_object()
        # Use latest proposal for this project
        proposal = project.proposals.order_by('-uploaded_at').first()
        if not proposal or not proposal.parsed_text:
            return Response({"error": "No parsed proposal found for project"}, status=status.HTTP_400_BAD_REQUEST)

        context = {
            "project_title": project.title or "",
        }
        backlog_model = run_backlog_pipeline(proposal.parsed_text, context)

        # Convert backlog model to dict
        backlog_dict = {
            "epics": [
                {
                    "title": epic.title,
                    "description": getattr(epic, "description", ""),
                    "sub_epics": [
                        {
                            "title": sub.title,
                            "user_stories": [
                                {
                                    "title": us.title,
                                    "tasks": [t.title for t in us.tasks],
                                }
                                for us in sub.user_stories
                            ],
                        }
                        for sub in epic.sub_epics
                    ],
                }
                for epic in backlog_model.epics
            ]
        }

        # Persist backlog structures
        Epic.objects.filter(project=project, ai=True).delete()
        for epic in backlog_model.epics[:20]:
            e = Epic.objects.create(
                project=project,
                title=str(epic.title)[:512],
                description=getattr(epic, "description", "")
            )
            for sub in epic.sub_epics[:20]:
                se = SubEpic.objects.create(epic=e, title=str(sub.title)[:512])
                for us in sub.user_stories[:20]:
                    u = UserStory.objects.create(sub_epic=se, title=str(us.title)[:512])
                    for t in us.tasks[:50]:
                        StoryTask.objects.create(user_story=u, title=str(t.title)[:512])

        return Response({
            "message": "Backlog generated successfully",
            "backlog": backlog_dict,
        }, status=status.HTTP_200_OK)


class ProposalViewSet(ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def create(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        project_id = request.data.get("project_id")

        if not file or not project_id:
            return Response({"error": "Missing file or project_id"}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(Project, id=project_id)

        if not file.name.lower().endswith(".pdf"):
            return Response({"error": "Only PDF files are supported"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with pdfplumber.open(file) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            return Response({"error": f"PDF parsing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        proposal = Proposal.objects.create(
            project=project,
            file=file,
            parsed_text=text,
            uploaded_by=request.user if request.user.is_authenticated else None
        )

        return Response({
            "message": "Proposal uploaded and parsed successfully",
            "proposal_id": proposal.id,
            "project_id": project.id,
            "parsed_text_preview": text[:300] + "..." if len(text) > 300 else text
        }, status=status.HTTP_201_CREATED)


