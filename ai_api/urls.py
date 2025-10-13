from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProposalViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='ai-projects')
router.register(r'proposals', ProposalViewSet, basename='ai-proposals')

urlpatterns = [
    path('', include(router.urls)),
]


