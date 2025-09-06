import uuid
from django.db import models
from django.conf import settings


class Project(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    title = models.CharField(
        max_length=255,
        help_text="Project name"
    )
    summary = models.TextField(
        help_text="Project summary"
    )
    risks = models.TextField(
        null=True,
        blank=True,
        help_text="Project risks"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title


class Task(models.Model):
    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    title = models.CharField(
        max_length=255,
        help_text="Task title"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Task description"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="todo",
        help_text="Task status"
    )
    role = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Required role for the task"
    )
    project_id = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    sprint = models.ForeignKey(
        "Sprint",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.title} ({self.status})"
    
class Member(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    role = models.CharField(
        max_length=100,
        help_text="Member role in the project"
    )
    project_id = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Proposal(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    file = models.FileField(
        upload_to="proposals/",
        help_text="PDF file of the proposal"
    )
    parsedText = models.TextField(
        null=True,
        blank=True,
        help_text="Extracted content from PDF"
    )
    methodology = models.TextField(
        null=True,
        blank=True,
        help_text="Project methodology"
    )
    project_id = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="proposals"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Proposal for {self.project_id.title}"


class Backlog(models.Model):
    TYPE_CHOICES = [
        ("epic", "Epic"),
        ("sub_epic", "Sub-Epic"),
        ("user_story", "User Story"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Type of backlog item"
    )
    project_id = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="backlogs"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.get_type_display()} - {self.project_id.title}"


class Epic(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    backlog = models.ForeignKey(
        "Backlog",
        on_delete=models.CASCADE,
        related_name="epics"
    )
    title = models.CharField(
        max_length=255,
        help_text="Epic title"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Epic description"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title


class SubEpic(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    epic = models.ForeignKey(
        "Epic",
        on_delete=models.CASCADE,
        related_name="sub_epics"
    )
    title = models.CharField(
        max_length=255,
        help_text="Sub-Epic title"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Sub-Epic description"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title


class UserStory(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    sub_epic = models.ForeignKey(
        "SubEpic",
        on_delete=models.CASCADE,
        related_name="user_stories"
    )
    title = models.CharField(
        max_length=255,
        help_text="User story title"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="User story description"
    )
    acceptance_criteria = models.TextField(
        null=True,
        blank=True,
        help_text="Acceptance criteria for the user story"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title


class UserTask(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user_story = models.ForeignKey(
        "UserStory",
        on_delete=models.CASCADE,
        related_name="user_tasks"
    )
    task = models.ForeignKey(
        "Task",
        on_delete=models.CASCADE,
        related_name="user_tasks"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.task.title} - {self.user_story.title}"


class Sprint(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    project_id = models.ForeignKey(
        "Project",
        on_delete=models.CASCADE,
        related_name="sprints"
    )
    duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Sprint duration in days"
    )
    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Sprint start date"
    )
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Sprint end date"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"Sprint {self.id} - {self.project_id.title}"
