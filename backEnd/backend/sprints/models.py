from django.db import models
import uuid
from projects.models import Project
from backlog.models import UserStory

class Sprint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_id = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="sprints")
    duration = models.PositiveIntegerField(null=True, blank=True, help_text="Sprint duration in days")
    start_date = models.DateField(null=True, blank=True, help_text="Sprint start date")
    end_date = models.DateField(null=True, blank=True, help_text="Sprint end date")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Sprint {self.id} - {self.project_id.title}"

class Task(models.Model):
    STATUS_CHOICES = [("todo", "To Do"), ("in_progress", "In Progress"), ("done", "Done")]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, help_text="Task title")
    description = models.TextField(null=True, blank=True, help_text="Task description")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo", help_text="Task status")
    role = models.CharField(max_length=100, null=True, blank=True, help_text="Required role for the task")
    project_id = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    sprint = models.ForeignKey(Sprint, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"

class UserTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_story = models.ForeignKey(UserStory, on_delete=models.CASCADE, related_name="user_tasks")
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="user_tasks")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.task.title} - {self.user_story.title}"