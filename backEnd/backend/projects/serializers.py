from rest_framework import serializers
from .models import Project, Member

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["role"]

class ProjectSerializer(serializers.ModelSerializer):
    members = MemberSerializer(many=True, required=False)

    class Meta:
        model = Project
        fields = ["id", "title", "summary", "members"]

    def create(self, validated_data):
        members_data = validated_data.pop("members", [])
        project = Project.objects.create(**validated_data)

        for member in members_data:
            Member.objects.create(project=project, **member)

        return project