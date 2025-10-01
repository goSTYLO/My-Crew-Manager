from rest_framework import serializers
from .models import Sprint, SprintGoal

class SprintGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SprintGoal
        fields = ["title"]

class SprintSerializer(serializers.ModelSerializer):
    goals = SprintGoalSerializer(many=True, required=False)

    class Meta:
        model = Sprint
        fields = ["id", "project", "week_number", "duration", "start_date", "end_date", "ai", "goals"]

    def create(self, validated_data):
        goals_data = validated_data.pop("goals", [])
        sprint = Sprint.objects.create(**validated_data)

        for goal in goals_data:
            SprintGoal.objects.create(sprint=sprint, **goal)

        return sprint