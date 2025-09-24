from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from .models import Proposal
import pdfplumber

class ProposalUploadView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get("file")
        project_id = request.data.get("project_id")

        if not file or not project_id:
            return Response({"error": "Missing file or project_id"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with pdfplumber.open(file) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            return Response({"error": f"PDF parsing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        proposal = Proposal.objects.create(
            project_id=project_id,
            file=file,
            parsed_text=text,
            uploaded_by=request.user if request.user.is_authenticated else None
        )

        return Response({
            "message": "Proposal uploaded and parsed successfully",
            "proposal_id": str(proposal.id),
            "project_id": str(project_id),
            "parsed_text_preview": text[:300] + "..." if len(text) > 300 else text
        }, status=status.HTTP_201_CREATED)
