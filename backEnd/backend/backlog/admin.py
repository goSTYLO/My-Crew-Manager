from django.contrib import admin
from .models import Backlog, Epic, SubEpic, UserStory, Task

@admin.register(Backlog)
class BacklogAdmin(admin.ModelAdmin):
    list_display = ["id", "project", "created_at", "updated_at"]
    search_fields = ["project__title"]
    list_filter = ["created_at"]

@admin.register(Epic)
class EpicAdmin(admin.ModelAdmin):
    list_display = ["id", "backlog", "title", "ai", "created_at"]
    search_fields = ["title", "backlog__project__title"]
    list_filter = ["ai", "created_at"]

@admin.register(SubEpic)
class SubEpicAdmin(admin.ModelAdmin):
    list_display = ["id", "epic", "title", "ai", "created_at"]
    search_fields = ["title", "epic__backlog__project__title"]
    list_filter = ["ai", "created_at"]

@admin.register(UserStory)
class UserStoryAdmin(admin.ModelAdmin):
    list_display = ["id", "sub_epic", "title", "ai", "created_at"]
    search_fields = ["title", "sub_epic__epic__backlog__project__title"]
    list_filter = ["ai", "created_at"]

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["id", "story", "goal", "title", "ai", "created_at"]
    search_fields = ["title", "goal__title", "story__sub_epic__epic__backlog__project__title"]
    list_filter = ["ai", "created_at"]