from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Team, Project, Sprint, Task, MoodCheckIn, Commit, Report, TeamMember, Backlog

User = get_user_model()

# Serializer for Project Roles (nested within ProjectCreateSerializer)
class ProjectRoleSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    name = serializers.CharField(max_length=255)
    role = serializers.CharField(max_length=255)
    is_selected = serializers.BooleanField(default=False)

# Frontend-specific Project serializer for create/update operations
class ProjectCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='name', max_length=255)  # Map title to name
    type = serializers.CharField(source='project_type', max_length=20)  # Map type to project_type
    startDate = serializers.DateField(source='start_date')  # Map startDate to start_date
    endDate = serializers.DateField(source='end_date')  # Map endDate to end_date
    roles = ProjectRoleSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Project
        fields = ['project_id', 'title', 'type', 'description', 'startDate', 'endDate', 'roles']
        read_only_fields = ['project_id']

    def create(self, validated_data):
        # Remove roles from validated_data as it's not a model field
        roles_data = validated_data.pop('roles', [])
        
        # Create a default team for the project (if not provided)
        team, _ = Team.objects.get_or_create(
            name=f"Team {validated_data['name']}",
            defaults={'name': f"Team {validated_data['name']}"}
        )
        validated_data['team'] = team
        
        # Create the project
        project = Project.objects.create(**validated_data)
        
        # TODO: Handle roles creation if needed (create separate ProjectRole model)
        # For now, we'll just store the basic project info
        
        return project

    def to_representation(self, instance):
        # Return data in frontend format
        return {
            'project_id': instance.project_id,
            'title': instance.name,
            'name': instance.name,  # Also include for compatibility
            'type': instance.project_type,
            'project_type': instance.project_type,  # Also include for compatibility
            'description': instance.description,
            'startDate': instance.start_date,
            'start_date': instance.start_date,  # Also include for compatibility
            'endDate': instance.end_date,
            'end_date': instance.end_date,  # Also include for compatibility
            'roles': [],  # TODO: Include actual roles when ProjectRole model is created
            'project_roles': [],  # Also include for compatibility
        }

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'name', 'email', 'role', 'created_at']
        read_only_fields = ['user_id', 'created_at']

class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'team_name', 'user', 'joined_at', 'role_in_team']
        read_only_fields = ['id', 'joined_at']

class TeamSerializer(serializers.ModelSerializer):
    members = TeamMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ['team_id', 'name', 'members', 'member_count', 'created_at', 'updated_at']
        read_only_fields = ['team_id', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

class ProjectSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    sprint_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ['project_id', 'name', 'project_type', 'description', 'start_date', 'end_date', 'team', 'team_name', 'sprint_count', 'created_at', 'updated_at']
        read_only_fields = ['project_id', 'created_at', 'updated_at']

    def get_sprint_count(self, obj):
        return obj.sprints.count()

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError({'end_date': 'end_date must be on/after start_date'})
        return attrs

class SprintSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = ['sprint_id', 'title', 'start_date', 'end_date', 'methodology', 'project', 'project_name', 'task_count', 'created_at', 'updated_at']
        read_only_fields = ['sprint_id', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()

    def validate(self, attrs):
        start = attrs.get('start_date')
        end = attrs.get('end_date')
        if start and end and start > end:
            raise serializers.ValidationError({'end_date': 'end_date must be on/after start_date'})
        return attrs

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.name', read_only=True)
    sprint_title = serializers.CharField(source='sprint.title', read_only=True)

    class Meta:
        model = Task
        fields = ['task_id', 'title', 'description', 'status', 'points', 'assigned_to', 'assigned_to_name', 'sprint', 'sprint_title', 'created_at', 'updated_at']
        read_only_fields = ['task_id', 'created_at', 'updated_at']

class MoodCheckInSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = MoodCheckIn
        fields = ['checkin_id', 'user', 'user_name', 'mood', 'notes', 'timestamp']
        read_only_fields = ['checkin_id', 'timestamp']

class CommitSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = Commit
        fields = ['commit_id', 'hash', 'message', 'timestamp', 'user', 'user_name', 'created_at']
        read_only_fields = ['commit_id', 'created_at']

class ReportSerializer(serializers.ModelSerializer):
    sprint_title = serializers.CharField(source='sprint.title', read_only=True)

    class Meta:
        model = Report
        fields = ['report_id', 'sprint', 'sprint_title', 'type', 'generated_at', 'data']
        read_only_fields = ['report_id', 'generated_at']

class BacklogSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)

    class Meta:
        model = Backlog
        fields = ['backlog_id', 'project', 'project_name', 'createdDate', 'lastUpdated']
        read_only_fields = ['backlog_id', 'createdDate', 'lastUpdated']

# Nested serializers for detailed views
class DetailedTaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    sprint = SprintSerializer(read_only=True)

    class Meta:
        model = Task
        fields = ['task_id', 'title', 'description', 'status', 'points', 'assigned_to', 'sprint', 'created_at', 'updated_at']

class DetailedSprintSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Sprint
        fields = ['sprint_id', 'title', 'start_date', 'end_date', 'methodology', 'project', 'tasks', 'created_at', 'updated_at']

class DetailedProjectSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    sprints = SprintSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['project_id', 'name', 'description', 'start_date', 'end_date', 'team', 'sprints', 'created_at', 'updated_at']
