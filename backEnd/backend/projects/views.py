from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status

from .models import Proposal, Project
from .serializers import ProjectSerializer
from sprints.serializers import SprintSerializer

from projects.services.llm_ingestion import ingest_proposal

import pdfplumber

# 🔹 CREATE
class ProjectCreateView(APIView):
    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save()
            return Response({
                "message": "Project created successfully",
                "project_id": str(project.id),
                "title": project.title
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 🔹 READ
class ProjectDetailView(APIView):
    def get(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

# 🔹 UPDATE
class ProjectUpdateView(APIView):
    def put(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            updated_project = serializer.save()
            return Response({
                "message": "Project updated successfully",
                "project_id": str(updated_project.id),
                "title": updated_project.title
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 🔹 DELETE
class ProjectDeleteView(APIView):
    def delete(self, request, project_id):
        project = get_object_or_404(Project, id=project_id)
        project.delete()
        return Response({"message": "Project deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

# 🔹 PROPOSAL UPLOAD
class ProposalUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
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

# 🔹 LLM INGESTION (UPDATE PROJECT)
class ProjectLLMIngestView(APIView):
    def put(self, request, project_id, proposal_id):
        project = get_object_or_404(Project, id=project_id)
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