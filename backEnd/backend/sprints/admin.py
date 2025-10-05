from django.contrib import admin
from .models import Sprint, SprintGoal

class SprintGoalInline(admin.TabularInline):
    model = SprintGoal
    extra = 1
    fields = ("title", "ai", "created_at")
    readonly_fields = ("created_at",)
    show_change_link = True

@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = (
        "id", "project", "week_number", "start_date", "end_date",
        "duration", "goal_count", "ai", "created_at"
    )
    list_filter = ("ai", "start_date", "end_date")
    search_fields = ("project__title",)
    inlines = [SprintGoalInline]

    def goal_count(self, obj):
        return obj.goals.count()
    goal_count.short_description = "Goals"

@admin.register(SprintGoal)
class SprintGoalAdmin(admin.ModelAdmin):
    list_display = ("id", "sprint", "title", "ai", "created_at")
    list_filter = ("ai", "created_at")
    search_fields = ("title", "sprint__project__title")