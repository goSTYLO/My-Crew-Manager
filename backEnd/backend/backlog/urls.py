from django.urls import path, include
from rest_framework.routers import DefaultRouter
from backlog.views import (
    BacklogViewSet,
    EpicViewSet,
    SubEpicViewSet,
    UserStoryViewSet,
    TaskViewSet
)

router = DefaultRouter()
router.register(r"backlogs", BacklogViewSet)
router.register(r"epics", EpicViewSet)
router.register(r"sub-epics", SubEpicViewSet)
router.register(r"user-stories", UserStoryViewSet)
router.register(r"tasks", TaskViewSet)

urlpatterns = [
    path("", include(router.urls)),
]