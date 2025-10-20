from django.contrib import admin
from .models import Project, Proposal, ProjectFeature, ProjectGoal, ProjectRole, TimelineWeek, TimelineItem, Epic, SubEpic, UserStory, StoryTask, ProjectMember, ProjectInvitation

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'summary', 'created_at', 'created_by']
    list_filter = ['created_at', 'created_by']
    search_fields = ['title', 'summary', 'created_by__name']
    date_hierarchy = 'created_at'

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_project_name', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at', 'project']
    search_fields = ['project__title', 'uploaded_by__name']
    date_hierarchy = 'uploaded_at'
    
    def get_project_name(self, obj):
        return obj.project.title
    get_project_name.short_description = 'Project Name'
    get_project_name.admin_order_field = 'project__title'

@admin.register(ProjectFeature)
class ProjectFeatureAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project_name']
    list_filter = ['project']
    search_fields = ['title', 'project__title']
    
    def project_name(self, obj):
        return obj.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__title'

@admin.register(ProjectGoal)
class ProjectGoalAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'role', 'project_name']
    list_filter = ['role', 'project']
    search_fields = ['title', 'role', 'project__title']
    
    def project_name(self, obj):
        return obj.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__title'

@admin.register(ProjectRole)
class ProjectRoleAdmin(admin.ModelAdmin):
    list_display = ['id', 'role', 'project_name']
    list_filter = ['project']
    search_fields = ['role', 'project__title']
    
    def project_name(self, obj):
        return obj.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__title'

@admin.register(TimelineWeek)
class TimelineWeekAdmin(admin.ModelAdmin):
    list_display = ['id', 'week_number', 'project_name']
    list_filter = ['project']
    search_fields = ['project__title']
    
    def project_name(self, obj):
        return obj.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__title'

@admin.register(TimelineItem)
class TimelineItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'week_number', 'project_name']
    list_filter = ['week__project']
    search_fields = ['title', 'week__project__title']
    
    def week_number(self, obj):
        return obj.week.week_number
    week_number.short_description = 'Week'
    week_number.admin_order_field = 'week__week_number'
    
    def project_name(self, obj):
        return obj.week.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'week__project__title'

@admin.register(Epic)
class EpicAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'project_name', 'ai']
    list_filter = ['ai', 'project']
    search_fields = ['title', 'description', 'project__title']
    
    def project_name(self, obj):
        return obj.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__title'

@admin.register(SubEpic)
class SubEpicAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'epic_title', 'project_name', 'ai']
    list_filter = ['ai', 'epic__project']
    search_fields = ['title', 'epic__title', 'epic__project__title']
    
    def epic_title(self, obj):
        return obj.epic.title
    epic_title.short_description = 'Epic'
    epic_title.admin_order_field = 'epic__title'
    
    def project_name(self, obj):
        return obj.epic.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'epic__project__title'

@admin.register(UserStory)
class UserStoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'sub_epic_title', 'epic_title', 'project_name', 'ai']
    list_filter = ['ai', 'sub_epic__epic__project']
    search_fields = ['title', 'sub_epic__title', 'sub_epic__epic__project__title']
    
    def sub_epic_title(self, obj):
        return obj.sub_epic.title
    sub_epic_title.short_description = 'Sub Epic'
    sub_epic_title.admin_order_field = 'sub_epic__title'
    
    def epic_title(self, obj):
        return obj.sub_epic.epic.title
    epic_title.short_description = 'Epic'
    epic_title.admin_order_field = 'sub_epic__epic__title'
    
    def project_name(self, obj):
        return obj.sub_epic.epic.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'sub_epic__epic__project__title'

@admin.register(StoryTask)
class StoryTaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user_story_title', 'sub_epic_title', 'epic_title', 'status', 'assignee', 'project_name', 'ai']
    list_filter = ['status', 'ai', 'user_story__sub_epic__epic__project', 'assignee']
    search_fields = ['title', 'user_story__title', 'assignee__user_name', 'user_story__sub_epic__epic__project__title']
    
    def user_story_title(self, obj):
        return obj.user_story.title
    user_story_title.short_description = 'User Story'
    user_story_title.admin_order_field = 'user_story__title'
    
    def sub_epic_title(self, obj):
        return obj.user_story.sub_epic.title
    sub_epic_title.short_description = 'Sub Epic'
    sub_epic_title.admin_order_field = 'user_story__sub_epic__title'
    
    def epic_title(self, obj):
        return obj.user_story.sub_epic.epic.title
    epic_title.short_description = 'Epic'
    epic_title.admin_order_field = 'user_story__sub_epic__epic__title'
    
    def project_name(self, obj):
        return obj.user_story.sub_epic.epic.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'user_story__sub_epic__epic__project__title'

@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = ['id', 'project_name', 'user_name', 'user_email', 'role', 'joined_at']
    list_filter = ['role', 'joined_at', 'project']
    search_fields = ['user_name', 'user_email', 'project__title']
    date_hierarchy = 'joined_at'
    
    def project_name(self, obj):
        return obj.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__title'

@admin.register(ProjectInvitation)
class ProjectInvitationAdmin(admin.ModelAdmin):
    list_display = ['id', 'project_name', 'invitee_name', 'invitee_email', 'invited_by_name', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'project', 'invited_by']
    search_fields = ['project__title', 'invitee__name', 'invitee__email', 'invited_by__name']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at']
    
    def project_name(self, obj):
        return obj.project.title
    project_name.short_description = 'Project'
    project_name.admin_order_field = 'project__title'
    
    def invitee_name(self, obj):
        return obj.invitee.name
    invitee_name.short_description = 'Invitee'
    invitee_name.admin_order_field = 'invitee__name'
    
    def invitee_email(self, obj):
        return obj.invitee.email
    invitee_email.short_description = 'Email'
    invitee_email.admin_order_field = 'invitee__email'
    
    def invited_by_name(self, obj):
        return obj.invited_by.name
    invited_by_name.short_description = 'Invited By'
    invited_by_name.admin_order_field = 'invited_by__name'
