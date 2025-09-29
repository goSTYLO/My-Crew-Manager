from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeamViewSet, ProjectViewSet, SprintViewSet, TaskViewSet,
    MoodCheckInViewSet, CommitViewSet, ReportViewSet
)

router = DefaultRouter()
router.register(r'teams', TeamViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'sprints', SprintViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'mood-checkins', MoodCheckInViewSet)
router.register(r'commits', CommitViewSet)
router.register(r'reports', ReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
