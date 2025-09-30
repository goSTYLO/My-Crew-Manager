from django.urls import path
from .views import (
    ProjectCreateView,
    ProjectDetailView,
    ProjectUpdateView,
    ProjectDeleteView,
    ProposalUploadView,
    ProjectLLMIngestView
)

urlpatterns = [
    # 🔹 Project CRUD
    path("create-project/", ProjectCreateView.as_view(), name="create-project"),
    path("project/<uuid:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
    path("project/<uuid:project_id>/update/", ProjectUpdateView.as_view(), name="project-update"),
    path("project/<uuid:project_id>/delete/", ProjectDeleteView.as_view(), name="project-delete"),

    # 🔹 Proposal Upload
    path("upload-proposal/", ProposalUploadView.as_view(), name="upload-proposal"),

    # 🔹 LLM Enrichment
    path("project/<uuid:project_id>/ingest-proposal/<uuid:proposal_id>/", ProjectLLMIngestView.as_view(), name="project-llm-ingest"),
]