from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from .models import Proposal, Project
from .serializers import ProjectSerializer
from LLMs.project_llm import run_pipeline_from_text
import pdfplumber

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

class ProposalUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")
        project_id = request.data.get("project_id")

        if not file or not project_id:
            return Response({"error": "Missing file or project_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Invalid project_id"}, status=status.HTTP_404_NOT_FOUND)

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
    

class ProposalLLMTriggerView(APIView):
    def post(self, request, proposal_id):
        try:
            proposal = Proposal.objects.get(id=proposal_id)
        except Proposal.DoesNotExist:
            return Response({"error": "Proposal not found"}, status=status.HTTP_404_NOT_FOUND)

        proposal_text = proposal.parsed_text
        if not proposal_text:
            return Response({"error": "No parsed text available"}, status=status.HTTP_400_BAD_REQUEST)

        project_model = run_pipeline_from_text(proposal_text)

        print(f"\n✅ LLM Output for Proposal {proposal_id}:\nTitle: {project_model.title}\nSummary: {project_model.summary}\nRoles: {[r.role for r in project_model.roles]}\nTimeline: {len(project_model.timeline)} weeks")

        return Response({"message": "LLM triggered successfully"}, status=status.HTTP_200_OK)