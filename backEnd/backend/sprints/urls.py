from rest_framework import serializers
from .models import Sprint, SprintGoal

# 🔹 SPRINT GOAL
class SprintGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SprintGoal
        fields = ["id", "title", "ai", "created_at"]
        read_only_fields = ["id", "created_at"]

# 🔹 SPRINT
class SprintSerializer(serializers.ModelSerializer):
    goals = SprintGoalSerializer(many=True, required=False)

    class Meta:
        model = Sprint
        fields = [
            "id", "project", "week_number", "duration",
            "start_date", "end_date", "ai", "goals", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        goals_data = validated_data.pop("goals", [])
        sprint = Sprint.objects.create(**validated_data)
        for goal in goals_data:
            SprintGoal.objects.create(sprint=sprint, **goal)
        return sprint

    def update(self, instance, validated_data):
        goals_data = validated_data.pop("goals", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if goals_data is not None:
            instance.goals.all().delete()
            for goal in goals_data:
                SprintGoal.objects.create(sprint=instance, **goal)

        return instance