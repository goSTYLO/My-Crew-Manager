from django.urls import path
from .views import ProjectListCreateView

urlpatterns = [
    path("project/", ProjectListCreateView.as_view(), name="project-list-create"),
]
