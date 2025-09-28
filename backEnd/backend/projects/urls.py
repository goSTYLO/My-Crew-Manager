from django.urls import path
from .views import ProjectCreateView, ProposalUploadView, ProposalLLMTriggerView

urlpatterns = [
    path("create-project/", ProjectCreateView.as_view(), name="create-project"),
    path("upload-proposal/", ProposalUploadView.as_view(), name="upload-proposal"),
    path("proposal/<uuid:proposal_id>/trigger-llm/", ProposalLLMTriggerView.as_view(), name="trigger-llm"),
]