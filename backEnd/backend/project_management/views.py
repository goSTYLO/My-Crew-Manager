from rest_framework import generics, permissions
from .models import Project
from .serializers import ProjectSerializer

class ProjectListCreateView(generics.ListCreateAPIView):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # http://127.0.0.1:8000/api/project_management/project
    #   JSON parameters{
    #    "name": "Test Project",
    #    "description": "This is a test project",
    #    "status": "in_progress",
    #    "start_date": "2025-08-25",
    #    "end_date": "2025-12-01"
    #   }

  
