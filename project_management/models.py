from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class Team(models.Model):
    team_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'team'

class Project(models.Model):
    project_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'project'

class Backlog(models.Model):
    backlog_id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='backlogs')
    createdDate = models.DateTimeField(auto_now_add=True)
    lastUpdated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Backlog {self.backlog_id} - {self.project.name}"

    class Meta:
        db_table = 'backlog'

class Sprint(models.Model):
    METHODOLOGY_CHOICES = [
        ('scrum', 'Scrum'),
        ('kanban', 'Kanban'),
        ('agile', 'Agile'),
        ('waterfall', 'Waterfall'),
    ]

    sprint_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    methodology = models.CharField(max_length=20, choices=METHODOLOGY_CHOICES, default='scrum')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sprints')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.project.name}"

    class Meta:
        db_table = 'sprint'

class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'Review'),
        ('done', 'Done'),
        ('blocked', 'Blocked'),
    ]

    task_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    points = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        default=1
    )
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.sprint.title}"

    class Meta:
        db_table = 'task'

class MoodCheckIn(models.Model):
    MOOD_CHOICES = [
        ('very_happy', 'Very Happy'),
        ('happy', 'Happy'),
        ('neutral', 'Neutral'),
        ('sad', 'Sad'),
        ('very_sad', 'Very Sad'),
    ]

    checkin_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mood_checkins')
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    notes = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.name} - {self.mood} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        db_table = 'moodcheckin'

class Commit(models.Model):
    commit_id = models.AutoField(primary_key=True)
    hash = models.CharField(max_length=40, unique=True)  # Git SHA-1 hash
    message = models.TextField()
    timestamp = models.DateTimeField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='commits')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.hash[:8]} - {self.message[:50]}"

    class Meta:
        db_table = 'commit'

class Report(models.Model):
    REPORT_TYPE_CHOICES = [
        ('sprint_summary', 'Sprint Summary'),
        ('velocity_report', 'Velocity Report'),
        ('burndown_chart', 'Burndown Chart'),
        ('team_performance', 'Team Performance'),
        ('mood_analytics', 'Mood Analytics'),
    ]

    report_id = models.AutoField(primary_key=True)
    sprint = models.ForeignKey(Sprint, on_delete=models.CASCADE, related_name='reports')
    type = models.CharField(max_length=30, choices=REPORT_TYPE_CHOICES)
    generated_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(default=dict, blank=True)  # Store report data as JSON

    def __str__(self):
        return f"{self.get_type_display()} - {self.sprint.title}"

    class Meta:
        db_table = 'report'

# Many-to-many relationship for team members
class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    role_in_team = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        unique_together = ('team', 'user')
        db_table = 'team_member'