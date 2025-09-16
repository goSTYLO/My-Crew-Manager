from django.db import models
import uuid
from projects.models import Project

class Backlog(models.Model):
    TYPE_CHOICES = [("epic", "Epic"), ("sub_epic", "Sub-Epic"), ("user_story", "User Story")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, help_text="Type of backlog item")
    project_id = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="backlogs")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_type_display()} - {self.project_id.title}"

class Epic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    backlog = models.ForeignKey(Backlog, on_delete=models.CASCADE, related_name="epics")
    title = models.CharField(max_length=255, help_text="Epic title")
    description = models.TextField(null=True, blank=True, help_text="Epic description")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class SubEpic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    epic = models.ForeignKey(Epic, on_delete=models.CASCADE, related_name="sub_epics")
    title = models.CharField(max_length=255, help_text="Sub-Epic title")
    description = models.TextField(null=True, blank=True, help_text="Sub-Epic description")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class UserStory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sub_epic = models.ForeignKey(SubEpic, on_delete=models.CASCADE, related_name="user_stories")
    title = models.CharField(max_length=255, help_text="User story title")
    description = models.TextField(null=True, blank=True, help_text="User story description")
    acceptance_criteria = models.TextField(null=True, blank=True, help_text="Acceptance criteria")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title