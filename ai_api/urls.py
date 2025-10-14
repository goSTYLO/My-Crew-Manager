from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet, ProposalViewSet,
    ProjectFeatureViewSet, ProjectRoleViewSet, ProjectGoalViewSet,
    TimelineWeekViewSet, TimelineItemViewSet,
    EpicViewSet, SubEpicViewSet, UserStoryViewSet, StoryTaskViewSet,
    ProjectMemberViewSet,
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='ai-projects')
router.register(r'proposals', ProposalViewSet, basename='ai-proposals')
router.register(r'project-features', ProjectFeatureViewSet, basename='project-features')
router.register(r'project-roles', ProjectRoleViewSet, basename='project-roles')
router.register(r'project-goals', ProjectGoalViewSet, basename='project-goals')
router.register(r'timeline-weeks', TimelineWeekViewSet, basename='timeline-weeks')
router.register(r'timeline-items', TimelineItemViewSet, basename='timeline-items')
router.register(r'epics', EpicViewSet, basename='epics')
router.register(r'sub-epics', SubEpicViewSet, basename='sub-epics')
router.register(r'user-stories', UserStoryViewSet, basename='user-stories')
router.register(r'story-tasks', StoryTaskViewSet, basename='story-tasks')
router.register(r'project-members', ProjectMemberViewSet, basename='project-members')

urlpatterns = [
    path('', include(router.urls)),
]


