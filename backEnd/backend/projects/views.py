#views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Project, Member, Feature, Goal, Proposal
from .serializers import ProjectSerializer, MemberSerializer, FeatureSerializer, GoalSerializer, ProposalSerializer
from projects.services.llm_ingestion import ingest_proposal
from backlog.services.backlog_ingestion import ingest_backlog

import pdfplumber

# 🔹 PROJECT
class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    @action(detail=True, methods=["put"], url_path="ingest-proposal/(?P<proposal_id>[^/.]+)")
    def ingest_proposal(self, request, pk=None, proposal_id=None):
        project = self.get_object()
        proposal = get_object_or_404(Proposal, id=proposal_id, project=project)

        if not proposal.parsed_text:
            return Response({"error": "Proposal has no parsed text"}, status=status.HTTP_400_BAD_REQUEST)

        title_override = request.data.get("title", project.title)

        try:
            enriched_project = ingest_proposal(
                text=proposal.parsed_text,
                user=request.user,
                title=title_override,
                existing_project=project
            )
        except Exception as e:
            return Response({"error": f"LLM ingestion failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Project enriched with LLM output",
            "project_id": str(enriched_project.id),
            "title": enriched_project.title,
            "sprints_created": enriched_project.sprints.count()
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["put"], url_path="generate-backlog")  # ✅ NEW
    def generate_backlog(self, request, pk=None):
        project = self.get_object()

        try:
            backlog = ingest_backlog(project)
        except Exception as e:
            return Response({"error": f"Backlog generation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Backlog generated successfully",
            "backlog_id": str(backlog.id),
            "epics_created": backlog.epics.filter(ai=True).count()
        }, status=status.HTTP_200_OK)


# 🔹 PROPOSAL
class ProposalViewSet(ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
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
            "proposal_id": str(proposal.id),
            "project_id": str(project.id),
            "parsed_text_preview": text[:300] + "..." if len(text) > 300 else text
        }, status=status.HTTP_201_CREATED)

# 🔹 MEMBER
class MemberViewSet(ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get("project_id")
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

# 🔹 FEATURE
class FeatureViewSet(ModelViewSet):
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get("project_id")
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

# 🔹 GOAL
class GoalViewSet(ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get("project_id")
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset