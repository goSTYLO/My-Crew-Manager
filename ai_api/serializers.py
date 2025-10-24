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
    project_file_url = serializers.SerializerMethodField()
    project_file_download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'title', 'summary', 'created_by', 'created_by_name', 'created_at', 'project_file', 'project_file_url', 'project_file_download_url']
        read_only_fields = ['id', 'created_at', 'created_by', 'created_by_name', 'project_file_url', 'project_file_download_url']
    
    def get_project_file_url(self, obj):
        """Generate URL for the project file"""
        if obj.project_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.project_file.url)
        return None
    
    def get_project_file_download_url(self, obj):
        """Generate download URL for the project file"""
        if obj.project_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/ai/projects/{obj.id}/download-file/')
        return None


class ProposalSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    
    class Meta:
        model = Proposal
        fields = ['id', 'project', 'file', 'parsed_text', 'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'download_url']
        read_only_fields = ['id', 'parsed_text', 'uploaded_by', 'uploaded_by_name', 'uploaded_at', 'download_url']
    
    def get_download_url(self, obj):
        """Generate download URL for the proposal file"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/ai/proposals/{obj.id}/download/')
        return None


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


class ProjectInvitationSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()
    invitee = serializers.SerializerMethodField()
    invited_by = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectInvitation
        fields = [
            'id', 'project', 'invitee', 'invited_by', 'status', 'message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_project(self, obj):
        return {
            'id': obj.project.id,
            'title': obj.project.title,
            'summary': obj.project.summary or '',
            'created_by': {
                'id': obj.project.created_by.user_id,
                'name': obj.project.created_by.name,
                'email': obj.project.created_by.email,
            },
            'created_at': obj.project.created_at.isoformat() if obj.project.created_at else None,
            'member_count': getattr(obj.project, 'member_count', 0),
            'task_count': getattr(obj.project, 'task_count', 0),
        }
    
    def get_invitee(self, obj):
        return {
            'id': obj.invitee.user_id,
            'name': obj.invitee.name,
            'email': obj.invitee.email,
            'avatar': obj.invitee.name[:2].upper() if obj.invitee.name else 'U'
        }
    
    def get_invited_by(self, obj):
        return {
            'id': obj.invited_by.user_id,
            'name': obj.invited_by.name,
            'email': obj.invited_by.email,
            'avatar': obj.invited_by.name[:2].upper() if obj.invited_by.name else 'U'
        }
    
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
            'actor', 'actor_name'
        ]
        read_only_fields = ['id', 'created_at', 'actor_name']
    action = serializers.ChoiceField(choices=['accept', 'decline'])
    
    def validate_action(self, value):
        if value not in ['accept', 'decline']:
            raise serializers.ValidationError("Action must be 'accept' or 'decline'")
        return value


