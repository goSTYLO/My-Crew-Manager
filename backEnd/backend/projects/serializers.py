from rest_framework import serializers
from .models import Project, Member

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "role"]
        read_only_fields = ["id"]

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

        # Update project fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Optional: update members if provided
        if members_data is not None:
            instance.members.all().delete()
            for member in members_data:
                Member.objects.create(project=instance, **member)

        return instance