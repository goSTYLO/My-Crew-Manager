#models.py
from django.db import models
from django.conf import settings


class Project(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_projects')
    created_at = models.DateTimeField(auto_now_add=True)


class Proposal(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='proposals')
    file = models.FileField(upload_to='proposals/')
    parsed_text = models.TextField(blank=True, null=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


# LLM Enrichment: Project-level structures
class ProjectFeature(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='features')
    title = models.CharField(max_length=512)


class ProjectRole(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='roles')
    role = models.CharField(max_length=255)


class ProjectGoal(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=512)
    role = models.CharField(max_length=255, blank=True, null=True)


class TimelineWeek(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='timeline_weeks')
    week_number = models.PositiveIntegerField()


class TimelineItem(models.Model):
    week = models.ForeignKey(TimelineWeek, on_delete=models.CASCADE, related_name='items')
    title = models.CharField(max_length=512)


# Backlog structures
class Epic(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='epics')
    title = models.CharField(max_length=512)
    description = models.TextField(blank=True, null=True)
    ai = models.BooleanField(default=True)


class SubEpic(models.Model):
    epic = models.ForeignKey(Epic, on_delete=models.CASCADE, related_name='sub_epics')
    title = models.CharField(max_length=512)
    ai = models.BooleanField(default=True)


class UserStory(models.Model):
    sub_epic = models.ForeignKey(SubEpic, on_delete=models.CASCADE, related_name='user_stories')
    title = models.CharField(max_length=512)
    ai = models.BooleanField(default=True)


class StoryTask(models.Model):
    user_story = models.ForeignKey(UserStory, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=512)
    status = models.CharField(max_length=50, default='pending')
    ai = models.BooleanField(default=True)
    assignee = models.ForeignKey('ProjectMember', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')


class ProjectMember(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_memberships')
    user_name = models.CharField(max_length=255, default='Unknown User')  # Store user name directly
    user_email = models.EmailField(default='unknown@example.com')  # Store user email directly
    role = models.CharField(max_length=255, default='Member')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['project', 'user']  # Prevent duplicate memberships
        db_table = 'ai_api_projectmember'  # Explicit table name
    
    def save(self, *args, **kwargs):
        # Automatically populate user_name and user_email from the user
        if self.user:
            self.user_name = self.user.name
            self.user_email = self.user.email
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user_name} - {self.role}"


