from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import os
from django.conf import settings

from .models import Team, Project, Sprint, Task, MoodCheckIn, Commit, Report, TeamMember, Backlog
from .serializers import (
    TeamSerializer, ProjectSerializer, SprintSerializer, TaskSerializer,
    MoodCheckInSerializer, CommitSerializer, ReportSerializer, TeamMemberSerializer,
    DetailedTaskSerializer, DetailedSprintSerializer, DetailedProjectSerializer,
    BacklogSerializer, ProjectCreateSerializer
)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Only teams the current user belongs to
        return Team.objects.filter(members__user=self.request.user).distinct()

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get('user_id')
        role_in_team = request.data.get('role_in_team', '')
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(user_id=user_id)
            
            team_member, created = TeamMember.objects.get_or_create(
                team=team,
                user=user,
                defaults={'role_in_team': role_in_team}
            )
            
            if created:
                return Response({'message': 'Member added successfully'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'Member already exists in team'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            team_member = TeamMember.objects.get(team=team, user_id=user_id)
            team_member.delete()
            return Response({'message': 'Member removed successfully'}, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response({'error': 'Member not found in team'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch', 'post'])
    def set_member_role(self, request, pk=None):
        team = self.get_object()
        user_id = request.data.get('user_id')
        role_in_team = request.data.get('role_in_team')

        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if role_in_team is None:
            return Response({'error': 'role_in_team is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            team_member = TeamMember.objects.get(team=team, user_id=user_id)
            team_member.role_in_team = role_in_team
            team_member.save()
            return Response({'message': 'Role updated successfully', 'role_in_team': team_member.role_in_team}, status=status.HTTP_200_OK)
        except TeamMember.DoesNotExist:
            return Response({'error': 'Member not found in team'}, status=status.HTTP_404_NOT_FOUND)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = []  # Temporarily remove authentication for testing

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateSerializer
        elif self.action == 'retrieve':
            return DetailedProjectSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        # Create project with the mapped fields
        project = serializer.save()
        return project

    @action(detail=False, methods=['post'], url_path='save-pdf')
    def save_pdf(self, request):
        """Save PDF file to proposals folder"""
        try:
            if 'pdf' not in request.FILES:
                return Response({'error': 'No PDF file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            pdf_file = request.FILES['pdf']
            project_title = request.data.get('project_title', 'Unknown_Project')
            
            # Create proposals directory if it doesn't exist
            proposals_dir = os.path.join(settings.BASE_DIR, 'proposals')
            os.makedirs(proposals_dir, exist_ok=True)
            
            # Generate safe filename
            safe_title = "".join(c for c in project_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
            safe_title = safe_title.replace(' ', '_')
            
            # Use the original filename if provided, otherwise generate one
            if hasattr(pdf_file, 'name') and pdf_file.name:
                filename = pdf_file.name
            else:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f'Project_{safe_title}_{timestamp}.pdf'
            
            # Full path for saving
            file_path = os.path.join(proposals_dir, filename)
            
            # Save the file
            with open(file_path, 'wb') as destination:
                for chunk in pdf_file.chunks():
                    destination.write(chunk)
            
            return Response({
                'message': 'PDF saved successfully',
                'filename': filename,
                'path': file_path,
                'relative_path': f'proposals/{filename}'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Failed to save PDF: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def sprints(self, request, pk=None):
        project = self.get_object()
        sprints = project.sprints.all()
        serializer = SprintSerializer(sprints, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        project = self.get_object()
        total_sprints = project.sprints.count()
        total_tasks = Task.objects.filter(sprint__project=project).count()
        completed_tasks = Task.objects.filter(sprint__project=project, status='done').count()
        
        return Response({
            'total_sprints': total_sprints,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        })

class SprintViewSet(viewsets.ModelViewSet):
    queryset = Sprint.objects.all()
    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Sprints of projects where user is a member of the team
        return Sprint.objects.filter(project__team__members__user=self.request.user).distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DetailedSprintSerializer
        return SprintSerializer

    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        sprint = self.get_object()
        tasks = sprint.tasks.all()
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def burndown(self, request, pk=None):
        sprint = self.get_object()
        tasks = sprint.tasks.all()
        
        # Calculate burndown data
        total_points = sum(task.points for task in tasks)
        completed_points = sum(task.points for task in tasks if task.status == 'done')
        remaining_points = total_points - completed_points
        
        return Response({
            'total_points': total_points,
            'completed_points': completed_points,
            'remaining_points': remaining_points,
            'completion_percentage': (completed_points / total_points * 100) if total_points > 0 else 0
        })

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        # Tasks under sprints/projects where user is a team member
        return Task.objects.filter(sprint__project__team__members__user=self.request.user).distinct()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DetailedTaskSerializer
        return TaskSerializer

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in [choice[0] for choice in Task.STATUS_CHOICES]:
            task.status = new_status
            task.save()
            return Response({'message': 'Status updated successfully'})
        else:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def assign(self, request, pk=None):
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(user_id=user_id)
            task.assigned_to = user
            task.save()
            return Response({'message': 'Task assigned successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class MoodCheckInViewSet(viewsets.ModelViewSet):
    queryset = MoodCheckIn.objects.all()
    serializer_class = MoodCheckInSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own mood check-ins
        return MoodCheckIn.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_mood_history(self, request):
        mood_history = self.get_queryset().order_by('-timestamp')
        serializer = self.get_serializer(mood_history, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mood_analytics(self, request):
        # Get mood analytics for the current user
        moods = self.get_queryset().values('mood').annotate(count=Count('mood'))
        mood_distribution = {item['mood']: item['count'] for item in moods}
        
        # Get recent mood trend (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_moods = self.get_queryset().filter(timestamp__gte=thirty_days_ago).order_by('timestamp')
        
        return Response({
            'mood_distribution': mood_distribution,
            'recent_trend': MoodCheckInSerializer(recent_moods, many=True).data
        })

class CommitViewSet(viewsets.ModelViewSet):
    queryset = Commit.objects.all()
    serializer_class = CommitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own commits
        return Commit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_commits(self, request):
        commits = self.get_queryset().order_by('-timestamp')
        serializer = self.get_serializer(commits, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def commit_stats(self, request):
        # Get commit statistics for the current user
        total_commits = self.get_queryset().count()
        
        # Commits in the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_commits = self.get_queryset().filter(timestamp__gte=thirty_days_ago).count()
        
        # Commits by day of week (portable)
        from django.db.models.functions import ExtractWeekDay
        commits_by_day = (
            self.get_queryset()
            .annotate(day=ExtractWeekDay('timestamp'))
            .values('day')
            .annotate(count=Count('commit_id'))
            .order_by('day')
        )
        
        return Response({
            'total_commits': total_commits,
            'recent_commits': recent_commits,
            'commits_by_day': list(commits_by_day)
        })

class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def generate_sprint_report(self, request):
        sprint_id = request.data.get('sprint_id')
        report_type = request.data.get('type', 'sprint_summary')
        
        try:
            sprint = Sprint.objects.get(sprint_id=sprint_id)
            
            # Generate report data based on type
            if report_type == 'sprint_summary':
                data = self._generate_sprint_summary(sprint)
            elif report_type == 'velocity_report':
                data = self._generate_velocity_report(sprint)
            elif report_type == 'burndown_chart':
                data = self._generate_burndown_data(sprint)
            else:
                data = {}
            
            report = Report.objects.create(
                sprint=sprint,
                type=report_type,
                data=data
            )
            
            serializer = self.get_serializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Sprint.DoesNotExist:
            return Response({'error': 'Sprint not found'}, status=status.HTTP_404_NOT_FOUND)

    def _generate_sprint_summary(self, sprint):
        tasks = sprint.tasks.all()
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status='done').count()
        total_points = sum(task.points for task in tasks)
        completed_points = sum(task.points for task in tasks if task.status == 'done')
        
        return {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'total_points': total_points,
            'completed_points': completed_points,
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        }

    def _generate_velocity_report(self, sprint):
        # This would typically include historical velocity data
        tasks = sprint.tasks.all()
        total_points = sum(task.points for task in tasks)
        
        return {
            'sprint_points': total_points,
            'velocity_trend': 'stable'  # This would be calculated from historical data
        }

    def _generate_burndown_data(self, sprint):
        tasks = sprint.tasks.all()
        total_points = sum(task.points for task in tasks)
        
        # Simple burndown calculation
        days_in_sprint = (sprint.end_date - sprint.start_date).days
        ideal_burndown = [total_points - (total_points / days_in_sprint * day) for day in range(days_in_sprint + 1)]
        
        return {
            'total_points': total_points,
            'ideal_burndown': ideal_burndown,
            'actual_burndown': []  # This would be calculated from actual task completion dates
        }

class BacklogViewSet(viewsets.ModelViewSet):
    queryset = Backlog.objects.all()
    serializer_class = BacklogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        base = Backlog.objects.filter(project__team__members__user=self.request.user).distinct()
        if project_id:
            return base.filter(project_id=project_id)
        return base