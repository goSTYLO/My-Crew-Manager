from django.urls import path, include
from rest_framework.routers import DefaultRouter
from sprints.views import SprintViewSet, SprintGoalViewSet

router = DefaultRouter()
router.register(r"sprints", SprintViewSet, basename="sprints")
router.register(r"sprint-goals", SprintGoalViewSet, basename="sprint-goals")

urlpatterns = [
    path("", include(router.urls)),
]