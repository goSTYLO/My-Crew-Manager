from django.contrib import admin
from .models import Sprint

@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = ("id", "project", "start_date", "end_date", "duration", "ai", "created_at")
    list_filter = ("ai", "start_date", "end_date")
    search_fields = ("project__title",)