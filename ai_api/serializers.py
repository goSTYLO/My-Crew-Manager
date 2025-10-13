from rest_framework import serializers
from .models import (
    Project, Proposal,
    ProjectFeature, ProjectRole, ProjectGoal,
    TimelineWeek, TimelineItem,
    Epic, SubEpic, UserStory, StoryTask,
)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'title', 'summary', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by']


class ProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ['id', 'project', 'file', 'parsed_text', 'uploaded_by', 'uploaded_at']
        read_only_fields = ['id', 'parsed_text', 'uploaded_by', 'uploaded_at']


class ProjectFeatureSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProjectFeature
        fields = ['id', 'project', 'title']


class ProjectRoleSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProjectRole
        fields = ['id', 'project', 'role']


class ProjectGoalSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProjectGoal
        fields = ['id', 'project', 'title', 'role']


class TimelineWeekSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = TimelineWeek
        fields = ['id', 'project', 'week_number']


class TimelineItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = TimelineItem
        fields = ['id', 'week', 'title']


class EpicSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Epic
        fields = ['id', 'project', 'title', 'description', 'ai']


class SubEpicSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = SubEpic
        fields = ['id', 'epic', 'title', 'ai']


class UserStorySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserStory
        fields = ['id', 'sub_epic', 'title', 'ai']


class StoryTaskSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = StoryTask
        fields = ['id', 'user_story', 'title', 'status', 'ai']


