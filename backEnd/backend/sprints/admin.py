from django.contrib import admin
from .models import Sprint, SprintGoal

class SprintGoalInline(admin.TabularInline):
    model = SprintGoal
    extra = 1
    fields = ("title", "ai")
    readonly_fields = ("created_at",)
    show_change_link = True

@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "week_number", "start_date", "end_date", "duration", "ai", "created_at")
    list_filter = ("ai", "start_date", "end_date")
    search_fields = ("project__title",)
    inlines = [SprintGoalInline]