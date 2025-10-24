#serializers.py
from rest_framework import serializers
from django.urls import reverse
from django.conf import settings
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
        project = obj.project
        
        # Get basic project info
        project_data = {
            'id': project.id,
            'title': project.title,
            'summary': project.summary or '',
            'created_by': {
                'id': project.created_by.user_id,
                'name': project.created_by.name,
                'email': project.created_by.email,
            },
            'created_at': project.created_at.isoformat() if project.created_at else None,
            'member_count': project.members.count(),
            'task_count': StoryTask.objects.filter(user_story__sub_epic__epic__project=project).count(),
            
            # Get project file information
            'project_file': project.project_file.url if project.project_file else None,
            'project_file_download_url': f'/api/ai/projects/{project.id}/download-file/' if project.project_file else None,
        }

        # Get project features
        features = ProjectFeature.objects.filter(project=project)
        project_data['features'] = [
            {'id': f.id, 'title': f.title}
            for f in features
        ]

        # Get project roles
        roles = ProjectRole.objects.filter(project=project)
        project_data['roles'] = [
            {'id': r.id, 'role': r.role}
            for r in roles
        ]

        # Get project goals
        goals = ProjectGoal.objects.filter(project=project)
        project_data['goals'] = [
            {'id': g.id, 'title': g.title, 'role': g.role}
            for g in goals
        ]

        # Get timeline
        timeline_weeks = TimelineWeek.objects.filter(project=project).prefetch_related('items')
        project_data['timeline'] = [
            {
                'id': w.id,
                'week_number': w.week_number,
                'timeline_items': [
                    {'id': i.id, 'title': i.title}
                    for i in w.items.all()
                ]
            }
            for w in timeline_weeks
        ]

        # Get members
        members = ProjectMember.objects.filter(project=project)
        project_data['members'] = [
            {
                'id': m.id,
                'user_name': m.user_name,
                'user_email': m.user_email,
                'role': m.role,
                'joined_at': m.joined_at.isoformat() if m.joined_at else None
            }
            for m in members
        ]

        # Get current proposal if any
        proposal = Proposal.objects.filter(project=project).order_by('-uploaded_at').first()
        if proposal:
            project_data['proposal'] = {
                'id': proposal.id,
                'file': proposal.file.url if proposal.file else None,
                'uploaded_by': proposal.uploaded_by.name if proposal.uploaded_by else None,
                'uploaded_at': proposal.uploaded_at.isoformat() if proposal.uploaded_at else None,
                'download_url': f'/api/ai/proposals/{proposal.id}/download/'
            }
        else:
            project_data['proposal'] = None

        # Get repositories
        repositories = Repository.objects.filter(project=project)
        project_data['repositories'] = [
            {
                'id': r.id,
                'name': r.name,
                'url': r.url,
                'branch': r.branch,
                'created_at': r.created_at.isoformat() if r.created_at else None
            }
            for r in repositories
        ]

        # Get backlog (epics, sub-epics, user stories, tasks)
        epics = Epic.objects.filter(project=project).prefetch_related(
            'sub_epics',
            'sub_epics__user_stories',
            'sub_epics__user_stories__tasks'
        )
        
        project_data['backlog'] = {
            'epics': [
                {
                    'id': epic.id,
                    'title': epic.title,
                    'description': epic.description,
                    'ai': epic.ai,
                    'sub_epics': [
                        {
                            'id': sub_epic.id,
                            'title': sub_epic.title,
                            'ai': sub_epic.ai,
                            'user_stories': [
                                {
                                    'id': story.id,
                                    'title': story.title,
                                    'ai': story.ai,
                                    'tasks': [
                                        {
                                            'id': task.id,
                                            'title': task.title,
                                            'status': task.status,
                                            'ai': task.ai,
                                            'assignee': {
                                                'id': task.assignee.id,
                                                'user_name': task.assignee.user_name,
                                                'user_email': task.assignee.user_email
                                            } if task.assignee else None
                                        }
                                        for task in story.tasks.all()
                                    ]
                                }
                                for story in sub_epic.user_stories.all()
                            ]
                        }
                        for sub_epic in epic.sub_epics.all()
                    ]
                }
                for epic in epics
            ]
        }

        return project_data
    
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


