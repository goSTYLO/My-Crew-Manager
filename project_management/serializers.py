from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Team, Project, Sprint, Task, MoodCheckIn, Commit, Report, TeamMember, Backlog

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'name', 'email', 'role', 'created_at']
        read_only_fields = ['user_id', 'created_at']

class TeamSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
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
        fields = ['project_id', 'name', 'description', 'start_date', 'end_date', 'team', 'team_name', 'sprint_count', 'created_at', 'updated_at']
        read_only_fields = ['project_id', 'created_at', 'updated_at']

    def get_sprint_count(self, obj):
        return obj.sprints.count()

class SprintSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Sprint
        fields = ['sprint_id', 'title', 'start_date', 'end_date', 'methodology', 'project', 'project_name', 'task_count', 'created_at', 'updated_at']
        read_only_fields = ['sprint_id', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()

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

class TeamMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'team_name', 'user', 'joined_at', 'role_in_team']
        read_only_fields = ['id', 'joined_at']

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
