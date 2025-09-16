from django.db import models
from django.conf import settings
import uuid

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, help_text="Project name")
    summary = models.TextField(help_text="Project summary")
    risks = models.TextField(null=True, blank=True, help_text="Project risks")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Member(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=100, help_text="Member role in the project")
    project_id = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="project_memberships")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Proposal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to="proposals/", help_text="PDF file of the proposal")
    parsedText = models.TextField(null=True, blank=True, help_text="Extracted content from PDF")
    methodology = models.TextField(null=True, blank=True, help_text="Project methodology")
    project_id = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="proposals")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Proposal for {self.project_id.title}"