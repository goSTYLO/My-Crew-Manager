from django.contrib import admin
from .models import Project, Proposal, Member, Feature, Goal

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "summary", "created_by", "ai", "created_at"]
    search_fields = ["title", "summary"]
    list_filter = ["ai", "created_at"]

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "uploaded_by", "file"]
    search_fields = ["project__title"]

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "role", "user", "ai"]
    search_fields = ["role", "project__title"]
    list_filter = ["ai"]

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "title", "ai"]
    search_fields = ["title", "project__title"]
    list_filter = ["ai"]

@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "title", "role", "ai"]
    search_fields = ["title", "role", "project__title"]
    list_filter = ["ai"]