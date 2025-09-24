from django.urls import path
from .views import ProposalUploadView

urlpatterns = [
    path("api/upload-proposal/", ProposalUploadView.as_view(), name="upload-proposal"),
]