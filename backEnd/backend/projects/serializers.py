from rest_framework import serializers
from .models import Project, Member, Proposal, Feature, Goal

# 🔹 MEMBER
class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "role", "user", "ai", "created_at"]
        read_only_fields = ["id", "created_at"]

# 🔹 PROJECT
class ProjectSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, required=False)

    class Meta:
        model = Project
        fields = ["id", "title", "summary", "members"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        members_data = validated_data.pop("members", [])
        project = Project.objects.create(**validated_data)
        for member in members_data:
            Member.objects.create(project=project, **member)
        return project

    def update(self, instance, validated_data):
        members_data = validated_data.pop("members", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if members_data is not None:
            instance.members.all().delete()
            for member in members_data:
                Member.objects.create(project=instance, **member)
        return instance

# 🔹 PROPOSAL
class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = "__all__"
        read_only_fields = ["id", "parsed_text", "uploaded_date", "updated_at"]

# 🔹 FEATURE
class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ["id", "project", "title", "description", "ai", "created_at"]
        read_only_fields = ["id", "created_at"]

# 🔹 GOAL
class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = [
            "id", "project", "sprint", "title", "status", "role", "ai", "created_at"
        ]
        read_only_fields = ["id", "created_at"]