from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Sprint, SprintGoal
from .serializers import SprintSerializer, SprintGoalSerializer

# 🔹 SPRINT
class SprintViewSet(ModelViewSet):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get("project_id")
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

# 🔹 SPRINT GOAL
class SprintGoalViewSet(ModelViewSet):
    queryset = SprintGoal.objects.all()
    serializer_class = SprintGoalSerializer

    def get_queryset(self):
        sprint_id = self.request.query_params.get("sprint_id")
        if sprint_id:
            return self.queryset.filter(sprint_id=sprint_id)
        return self.queryset