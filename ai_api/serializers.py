from rest_framework import serializers
from .models import (
    Project, Proposal,
    ProjectFeature, ProjectRole, ProjectGoal,
    TimelineWeek, TimelineItem,
    Epic, SubEpic, UserStory, StoryTask, ProjectMember,
)


class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = Project
        fields = ['id', 'title', 'summary', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'created_by', 'created_by_name']


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
    assignee = serializers.PrimaryKeyRelatedField(queryset=ProjectMember.objects.all(), required=False, allow_null=True)
    assignee_details = serializers.SerializerMethodField()

    class Meta:
        model = StoryTask
        fields = ['id', 'user_story', 'title', 'status', 'ai', 'assignee', 'assignee_details']

    def get_assignee_details(self, obj):
        if obj.assignee:
            return {
                'id': obj.assignee.id,
                'user_name': obj.assignee.user_name,
                'user_email': obj.assignee.user_email,
            }
        return None


class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMember
        fields = ['id', 'project', 'user', 'user_name', 'user_email', 'role', 'joined_at']
        read_only_fields = ['id', 'joined_at']


