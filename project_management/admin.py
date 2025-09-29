from django.contrib import admin
from .models import Team, Project, Sprint, Task, MoodCheckIn, Commit, Report, TeamMember

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['team_id', 'name', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['project_id', 'name', 'team', 'start_date', 'end_date']
    list_filter = ['start_date', 'end_date', 'team']
    search_fields = ['name', 'description']
    date_hierarchy = 'start_date'

@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ['sprint_id', 'title', 'project', 'methodology', 'start_date', 'end_date']
    list_filter = ['methodology', 'start_date', 'end_date', 'project']
    search_fields = ['title', 'project__name']
    date_hierarchy = 'start_date'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['task_id', 'title', 'status', 'points', 'assigned_to', 'sprint']
    list_filter = ['status', 'points', 'sprint__project', 'assigned_to']
    search_fields = ['title', 'description', 'assigned_to__name']
    list_editable = ['status', 'points']

@admin.register(MoodCheckIn)
class MoodCheckInAdmin(admin.ModelAdmin):
    list_display = ['checkin_id', 'user', 'mood', 'timestamp']
    list_filter = ['mood', 'timestamp']
    search_fields = ['user__name', 'notes']
    date_hierarchy = 'timestamp'

@admin.register(Commit)
class CommitAdmin(admin.ModelAdmin):
    list_display = ['commit_id', 'hash', 'user', 'timestamp']
    list_filter = ['timestamp', 'user']
    search_fields = ['hash', 'message', 'user__name']
    date_hierarchy = 'timestamp'

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['report_id', 'sprint', 'type', 'generated_at']
    list_filter = ['type', 'generated_at', 'sprint__project']
    search_fields = ['sprint__title', 'type']
    date_hierarchy = 'generated_at'

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'team', 'user', 'role_in_team', 'joined_at']
    list_filter = ['team', 'joined_at', 'role_in_team']
    search_fields = ['team__name', 'user__name', 'role_in_team']