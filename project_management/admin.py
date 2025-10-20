from django.contrib import admin
from .models import Team, Project, Sprint, Task, MoodCheckIn, Commit, Report, TeamMember, Backlog

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
    list_display = ['sprint_id', 'title', 'project_name', 'methodology', 'start_date', 'end_date']
    list_filter = ['methodology', 'start_date', 'end_date', 'project']
    search_fields = ['title', 'project__name']
    date_hierarchy = 'start_date'
    
    def project_name(self, obj):
        return obj.project.name
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__name'

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['task_id', 'title', 'status', 'points', 'assigned_to', 'sprint', 'project_name']
    list_filter = ['status', 'points', 'sprint__project', 'assigned_to']
    search_fields = ['title', 'description', 'assigned_to__name', 'sprint__project__name']
    list_editable = ['status', 'points']
    
    def project_name(self, obj):
        return obj.sprint.project.name
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'sprint__project__name'

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
    list_display = ['report_id', 'sprint', 'type', 'project_name', 'generated_at']
    list_filter = ['type', 'generated_at', 'sprint__project']
    search_fields = ['sprint__title', 'type', 'sprint__project__name']
    date_hierarchy = 'generated_at'
    
    def project_name(self, obj):
        return obj.sprint.project.name
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'sprint__project__name'

@admin.register(Backlog)
class BacklogAdmin(admin.ModelAdmin):
    list_display = ['backlog_id', 'project_name', 'createdDate', 'lastUpdated']
    list_filter = ['createdDate', 'lastUpdated', 'project']
    search_fields = ['project__name']
    date_hierarchy = 'createdDate'
    
    def project_name(self, obj):
        return obj.project.name
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__name'

@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'team', 'user', 'role_in_team', 'joined_at']
    list_filter = ['team', 'joined_at', 'role_in_team']
    search_fields = ['team__name', 'user__name', 'role_in_team']