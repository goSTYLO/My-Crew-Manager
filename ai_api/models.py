#models.py
from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class Project(models.Model):
    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    # Optional file upload field
    project_file = models.FileField(upload_to='projects/', blank=True, null=True, help_text="Upload a project-related file (optional)")
    
    def __str__(self):
        return self.title


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


class ProjectInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invitations')
    invitee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_invites')
    invited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_sent_invites')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    role = models.CharField(max_length=255, default='Member')  # Role the user is invited with
    message = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['project', 'invitee']  # Prevent duplicate invitations
        db_table = 'ai_api_projectinvitation'
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['invitee', 'status']),
        ]
    
    def __str__(self):
        return f"{self.invitee.name} -> {self.project.title} ({self.status})"
    
    def save(self, *args, **kwargs):
        # Check if status is being changed to 'accepted'
        if self.pk:  # Only for existing objects
            try:
                old_invitation = ProjectInvitation.objects.get(pk=self.pk)
                if old_invitation.status != 'accepted' and self.status == 'accepted':
                    # Status is being changed to accepted, create ProjectMember
                    print(f"Invitation {self.pk} status changed to accepted, creating ProjectMember")
                    ProjectMember.objects.get_or_create(
                        project=self.project,
                        user=self.invitee,
                        defaults={'role': 'Member'}
                    )
                    print(f"ProjectMember created for user {self.invitee.name} in project {self.project.title}")
            except ProjectInvitation.DoesNotExist:
                pass  # New invitation, no need to check
        
        super().save(*args, **kwargs)
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Prevent self-invitation
        if self.invitee == self.invited_by:
            raise ValidationError("Cannot invite yourself to a project")
        
        # Check if user is already a member
        if ProjectMember.objects.filter(project=self.project, user=self.invitee).exists():
            raise ValidationError("User is already a member of this project")
        
        # Check for existing pending invitation
        if self.status == 'pending':
            existing = ProjectInvitation.objects.filter(
                project=self.project, 
                invitee=self.invitee, 
                status='pending'
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError("A pending invitation already exists for this user")


class Repository(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='repositories')
    name = models.CharField(max_length=255)
    url = models.URLField()
    branch = models.CharField(max_length=100, default='main')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'ai_api_repository'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.project.title}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('project_invitation', 'Project Invitation'),
        ('task_assigned', 'Task Assigned'),
        ('task_updated', 'Task Updated'),
        ('task_completed', 'Task Completed'),
        ('mention', 'Mentioned in Chat'),
        ('deadline_reminder', 'Deadline Reminder'),
        ('project_update', 'Project Update'),
        ('member_joined', 'Member Joined Project'),
        ('member_left', 'Member Left Project'),
    ]
    
    # Core fields
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Generic relations for flexibility
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Metadata
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional action URL for frontend navigation
    action_url = models.CharField(max_length=500, blank=True, null=True)
    
    # Optional actor (who triggered the notification)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='triggered_notifications')
    
    class Meta:
        db_table = 'ai_api_notification'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.recipient.name} - {self.title}"


