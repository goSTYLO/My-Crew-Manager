#serializers.py
from rest_framework import serializers
from .models import (
    Project, Proposal,
    ProjectFeature, ProjectRole, ProjectGoal,
    TimelineWeek, TimelineItem,
    Epic, SubEpic, UserStory, StoryTask, ProjectMember, ProjectInvitation,
    Notification, Repository,
)


class ProjectSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    status_updated_by_name = serializers.CharField(source='status_updated_by.name', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'summary', 'status', 'status_updated_at', 
            'status_updated_by_name', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'created_by_name', 'status_updated_at', 'status_updated_by_name']


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


class TimelineItemSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = TimelineItem
        fields = ['id', 'week', 'title']


class TimelineWeekSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    timeline_items = TimelineItemSerializer(source='items', many=True, read_only=True)

    class Meta:
        model = TimelineWeek
        fields = ['id', 'project', 'week_number', 'timeline_items']


class EpicSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Epic
        fields = ['id', 'project', 'title', 'description', 'ai', 'is_complete']


class SubEpicSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = SubEpic
        fields = ['id', 'epic', 'title', 'ai', 'is_complete']


class UserStorySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserStory
        fields = ['id', 'sub_epic', 'title', 'ai', 'is_complete']


class StoryTaskSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    user_story = serializers.PrimaryKeyRelatedField(queryset=UserStory.objects.all(), required=False)
    title = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    ai = serializers.BooleanField(required=False)
    assignee = serializers.PrimaryKeyRelatedField(queryset=ProjectMember.objects.all(), required=False, allow_null=True)
    assignee_details = serializers.SerializerMethodField()
    commit_title = serializers.CharField(required=False, allow_blank=True)
    commit_branch = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = StoryTask
        fields = ['id', 'user_story', 'title', 'status', 'ai', 'assignee', 'assignee_details', 'commit_title', 'commit_branch']

    def validate(self, data):
        """Validate that commit_title is provided when status is 'done'"""
        if data.get('status') == 'done' and not data.get('commit_title'):
            raise serializers.ValidationError("Commit title is required when marking task as done.")
        return data

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


class ProjectInvitationSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    invitee_name = serializers.CharField(source='invitee.name', read_only=True)
    invitee_email = serializers.CharField(source='invitee.email', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.name', read_only=True)
    
    class Meta:
        model = ProjectInvitation
        fields = [
            'id', 'project', 'project_title', 'invitee', 'invitee_name', 'invitee_email',
            'invited_by', 'invited_by_name', 'status', 'role', 'message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at', 'invited_by']
    
    def validate(self, data):
        # Additional validation for creating invitations
        if self.instance is None:  # Creating new invitation
            project = data.get('project')
            invitee = data.get('invitee')
            
            # Check if user is already a member
            if ProjectMember.objects.filter(project=project, user=invitee).exists():
                raise serializers.ValidationError("User is already a member of this project")
            
            # Check for existing pending invitation
            if ProjectInvitation.objects.filter(
                project=project, 
                invitee=invitee, 
                status='pending'
            ).exists():
                raise serializers.ValidationError("A pending invitation already exists for this user")
        
        return data


class ProjectInvitationActionSerializer(serializers.Serializer):
    """Serializer for accept/decline actions"""


class RepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Repository
        fields = ['id', 'project', 'name', 'url', 'branch', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message', 
            'is_read', 'read_at', 'created_at', 'action_url',
            'actor', 'actor_name', 'object_id'
        ]
        read_only_fields = ['id', 'created_at', 'actor_name']


