from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from backlog.models import Backlog, Epic, SubEpic, UserStory, Task
from backlog.serializers import (
    BacklogSerializer,
    EpicSerializer,
    SubEpicSerializer,
    UserStorySerializer,
    TaskSerializer
)
from projects.models import Project
from backlog.services.backlog_ingestion import ingest_backlog

# 🔹 BACKLOG
class BacklogViewSet(ModelViewSet):
    queryset = Backlog.objects.all()
    serializer_class = BacklogSerializer

    def get_queryset(self):
        project_id = self.request.query_params.get("project_id")
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

# 🔹 EPIC
class EpicViewSet(ModelViewSet):
    queryset = Epic.objects.all()
    serializer_class = EpicSerializer

    def get_queryset(self):
        backlog_id = self.request.query_params.get("backlog_id")
        if backlog_id:
            return self.queryset.filter(backlog_id=backlog_id)
        return self.queryset

# 🔹 SUB-EPIC
class SubEpicViewSet(ModelViewSet):
    queryset = SubEpic.objects.all()
    serializer_class = SubEpicSerializer

    def get_queryset(self):
        epic_id = self.request.query_params.get("epic_id")
        if epic_id:
            return self.queryset.filter(epic_id=epic_id)
        return self.queryset

# 🔹 USER STORY
class UserStoryViewSet(ModelViewSet):
    queryset = UserStory.objects.all()
    serializer_class = UserStorySerializer

    def get_queryset(self):
        sub_epic_id = self.request.query_params.get("sub_epic_id")
        if sub_epic_id:
            return self.queryset.filter(sub_epic_id=sub_epic_id)
        return self.queryset

# 🔹 TASK
class TaskViewSet(ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        story_id = self.request.query_params.get("story_id")
        if story_id:
            return self.queryset.filter(story_id=story_id)
        return self.queryset