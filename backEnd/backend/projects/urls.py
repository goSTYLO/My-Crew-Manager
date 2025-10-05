from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    ProposalViewSet,
    MemberViewSet,
    FeatureViewSet,
    GoalViewSet
)

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='projects')  # includes /<id>/generate-backlog/
router.register(r'proposals', ProposalViewSet, basename='proposals')
router.register(r'members', MemberViewSet, basename='members')
router.register(r'features', FeatureViewSet, basename='features')
router.register(r'goals', GoalViewSet, basename='goals')

urlpatterns = [
    path("", include(router.urls)),
]