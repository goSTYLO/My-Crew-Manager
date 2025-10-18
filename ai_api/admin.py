from django.contrib import admin
from .models import Project, Proposal, ProjectFeature, ProjectGoal, ProjectRole, TimelineWeek, TimelineItem, Epic, SubEpic, UserStory, StoryTask, ProjectMember

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'summary', 'created_at', 'created_by']
    list_filter = ['created_at', 'created_by']
    search_fields = ['title', 'summary', 'created_by__name']
    date_hierarchy = 'created_at'

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at', 'project']
    search_fields = ['project__title', 'uploaded_by__name']
    date_hierarchy = 'uploaded_at'

@admin.register(ProjectFeature)
class ProjectFeatureAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project']
    list_filter = ['project']
    search_fields = ['title', 'project__title']

@admin.register(ProjectGoal)
class ProjectGoalAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'role', 'project']
    list_filter = ['role', 'project']
    search_fields = ['title', 'role', 'project__title']

@admin.register(ProjectRole)
class ProjectRoleAdmin(admin.ModelAdmin):
    list_display = ['id', 'role', 'project']
    list_filter = ['project']
    search_fields = ['role', 'project__title']

@admin.register(TimelineWeek)
class TimelineWeekAdmin(admin.ModelAdmin):
    list_display = ['id', 'week_number', 'project']
    list_filter = ['project']
    search_fields = ['project__title']

@admin.register(TimelineItem)
class TimelineItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'week']
    list_filter = ['week__project']
    search_fields = ['title', 'week__project__title']

@admin.register(Epic)
class EpicAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project', 'ai']
    list_filter = ['ai', 'project']
    search_fields = ['title', 'description', 'project__title']

@admin.register(SubEpic)
class SubEpicAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'epic', 'ai']
    list_filter = ['ai', 'epic__project']
    search_fields = ['title', 'epic__title']

@admin.register(UserStory)
class UserStoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'sub_epic', 'ai']
    list_filter = ['ai', 'sub_epic__epic__project']
    search_fields = ['title', 'sub_epic__title']

@admin.register(StoryTask)
class StoryTaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user_story', 'status', 'assignee', 'ai']
    list_filter = ['status', 'ai', 'user_story__sub_epic__epic__project', 'assignee']
    search_fields = ['title', 'user_story__title', 'assignee__user_name']

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'project', 'user_name', 'user_email', 'role', 'joined_at']
    list_filter = ['role', 'joined_at', 'project']
    search_fields = ['user_name', 'user_email', 'project__title']
    date_hierarchy = 'joined_at'
