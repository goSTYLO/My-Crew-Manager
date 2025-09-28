from rest_framework import serializers
from .models import Sprint, SprintTask

class SprintTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SprintTask
        fields = ["title"]

class SprintSerializer(serializers.ModelSerializer):
    tasks = SprintTaskSerializer(many=True, required=False)

    class Meta:
        model = Sprint
        fields = ["id", "project", "week_number", "duration", "start_date", "end_date", "ai", "tasks"]

    def create(self, validated_data):
        tasks_data = validated_data.pop("tasks", [])
        sprint = Sprint.objects.create(**validated_data)

        for task in tasks_data:
            SprintTask.objects.create(sprint=sprint, **task)

        return sprint