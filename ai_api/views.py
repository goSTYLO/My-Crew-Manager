from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from .models import (
    Project, Proposal,
    ProjectFeature, ProjectRole, ProjectGoal,
    TimelineWeek, TimelineItem,
    Epic, SubEpic, UserStory, StoryTask, ProjectMember, ProjectInvitation,
)
from .serializers import (
    ProjectSerializer, ProposalSerializer,
    ProjectFeatureSerializer, ProjectRoleSerializer, ProjectGoalSerializer,
    TimelineWeekSerializer, TimelineItemSerializer,
    EpicSerializer, SubEpicSerializer, UserStorySerializer, StoryTaskSerializer,
    ProjectMemberSerializer, ProjectInvitationSerializer, ProjectInvitationActionSerializer,
)

# Real LLM pipelines
from LLMs.project_llm import run_pipeline_from_text, model_to_dict
from LLMs.backlog_llm import run_backlog_pipeline

import pdfplumber


class ProjectViewSet(ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["put"], url_path="ingest-proposal/(?P<proposal_id>[^/.]+)")
    def ingest_proposal(self, request, pk=None, proposal_id=None):
        project = self.get_object()
        proposal = get_object_or_404(Proposal, id=proposal_id, project=project)

        if not proposal.parsed_text:
            return Response({"error": "Proposal has no parsed text"}, status=status.HTTP_400_BAD_REQUEST)

        # Run real LLM pipeline and return structured output
        project_model = run_pipeline_from_text(proposal.parsed_text)
        output = model_to_dict(project_model)

        # Optionally persist minimal fields on our local Project
        title_override = request.data.get("title")
        if title_override:
            output["title"] = title_override
        project.title = output.get("title") or project.title
        project.summary = output.get("summary") or project.summary
        project.save(update_fields=["title", "summary"])

        # Persist features
        ProjectFeature.objects.filter(project=project).delete()
        for feat in output.get("features", [])[:10]:
            ProjectFeature.objects.create(project=project, title=str(feat)[:512])

        # Persist roles
        ProjectRole.objects.filter(project=project).delete()
        for role in output.get("roles", [])[:20]:
            ProjectRole.objects.create(project=project, role=str(role)[:255])

        # Persist goals
        ProjectGoal.objects.filter(project=project).delete()
        for g in output.get("goals", [])[:20]:
            ProjectGoal.objects.create(
                project=project,
                title=str(g.get("title", ""))[:512],
                role=(g.get("role") or "")[:255]
            )

        # Persist timeline
        TimelineWeek.objects.filter(project=project).delete()
        for week in output.get("timeline", [])[:12]:
            tw = TimelineWeek.objects.create(project=project, week_number=int(week.get("week_number", 0) or 0))
            for item in week.get("goals", [])[:20]:
                TimelineItem.objects.create(week=tw, title=str(item)[:512])

        return Response({
            "message": "Project enriched with LLM output",
            "project_id": project.id,
            "llm": output,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["put"], url_path="generate-backlog")
    def generate_backlog(self, request, pk=None):
        project = self.get_object()
        # Use latest proposal for this project
        proposal = project.proposals.order_by('-uploaded_at').first()
        if not proposal or not proposal.parsed_text:
            return Response({"error": "No parsed proposal found for project"}, status=status.HTTP_400_BAD_REQUEST)

        context = {
            "project_title": project.title or "",
        }
        backlog_model = run_backlog_pipeline(proposal.parsed_text, context)

        # Convert backlog model to dict
        backlog_dict = {
            "epics": [
                {
                    "title": epic.title,
                    "description": getattr(epic, "description", ""),
                    "sub_epics": [
                        {
                            "title": sub.title,
                            "user_stories": [
                                {
                                    "title": us.title,
                                    "tasks": [t.title for t in us.tasks],
                                }
                                for us in sub.user_stories
                            ],
                        }
                        for sub in epic.sub_epics
                    ],
                }
                for epic in backlog_model.epics
            ]
        }

        # Persist backlog structures
        Epic.objects.filter(project=project, ai=True).delete()
        for epic in backlog_model.epics[:20]:
            e = Epic.objects.create(
                project=project,
                title=str(epic.title)[:512],
                description=getattr(epic, "description", "")
            )
            for sub in epic.sub_epics[:20]:
                se = SubEpic.objects.create(epic=e, title=str(sub.title)[:512])
                for us in sub.user_stories[:20]:
                    u = UserStory.objects.create(sub_epic=se, title=str(us.title)[:512])
                    for t in us.tasks[:50]:
                        StoryTask.objects.create(user_story=u, title=str(t.title)[:512])

        return Response({
            "message": "Backlog generated successfully",
            "backlog": backlog_dict,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], url_path="backlog")
    def backlog(self, request, pk=None):
        """Return the project's backlog as a nested structure: epics -> sub_epics -> user_stories -> tasks"""
        project = self.get_object()

        epics = Epic.objects.filter(project=project).order_by('id')
        result = []
        for e in epics:
            sub_epics = []
            for se in e.sub_epics.all().order_by('id'):
                user_stories = []
                for us in se.user_stories.all().order_by('id'):
                    tasks = []
                    for t in us.tasks.all().order_by('id'):
                        assignee = t.assignee
                        tasks.append({
                            'id': t.id,
                            'title': t.title,
                            'status': t.status,
                            'ai': t.ai,
                            'assignee': (
                                {
                                    'id': assignee.id,
                                    'user_name': getattr(assignee, 'user_name', None),
                                    'user_email': getattr(assignee, 'user_email', None),
                                }
                                if assignee is not None else None
                            ),
                        })
                    user_stories.append({
                        'id': us.id,
                        'title': us.title,
                        'ai': us.ai,
                        'tasks': tasks,
                    })
                sub_epics.append({
                    'id': se.id,
                    'title': se.title,
                    'ai': se.ai,
                    'user_stories': user_stories,
                })
            result.append({
                'id': e.id,
                'title': e.title,
                'description': e.description,
                'ai': e.ai,
                'sub_epics': sub_epics,
            })

        return Response({'project_id': project.id, 'epics': result}, status=status.HTTP_200_OK)


class ProposalViewSet(ModelViewSet):
    queryset = Proposal.objects.all()
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def create(self, request, *args, **kwargs):
        file = request.FILES.get("file")
        project_id = request.data.get("project_id")

        if not file or not project_id:
            return Response({"error": "Missing file or project_id"}, status=status.HTTP_400_BAD_REQUEST)

        project = get_object_or_404(Project, id=project_id)

        if not file.name.lower().endswith(".pdf"):
            return Response({"error": "Only PDF files are supported"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with pdfplumber.open(file) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        except Exception as e:
            return Response({"error": f"PDF parsing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        proposal = Proposal.objects.create(
            project=project,
            file=file,
            parsed_text=text,
            uploaded_by=request.user if request.user.is_authenticated else None
        )

        return Response({
            "message": "Proposal uploaded and parsed successfully",
            "proposal_id": proposal.id,
            "project_id": project.id,
            "parsed_text_preview": text[:300] + "..." if len(text) > 300 else text
        }, status=status.HTTP_201_CREATED)



class ProjectFeatureViewSet(ModelViewSet):
    queryset = ProjectFeature.objects.all()
    serializer_class = ProjectFeatureSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset


class ProjectRoleViewSet(ModelViewSet):
    queryset = ProjectRole.objects.all()
    serializer_class = ProjectRoleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset


class ProjectGoalViewSet(ModelViewSet):
    queryset = ProjectGoal.objects.all()
    serializer_class = ProjectGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset


class TimelineWeekViewSet(ModelViewSet):
    queryset = TimelineWeek.objects.all()
    serializer_class = TimelineWeekSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset


class TimelineItemViewSet(ModelViewSet):
    queryset = TimelineItem.objects.all()
    serializer_class = TimelineItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        week_id = self.request.query_params.get('week_id')
        if week_id:
            return self.queryset.filter(week_id=week_id)
        return self.queryset


class EpicViewSet(ModelViewSet):
    queryset = Epic.objects.all()
    serializer_class = EpicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset


class SubEpicViewSet(ModelViewSet):
    queryset = SubEpic.objects.all()
    serializer_class = SubEpicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        epic_id = self.request.query_params.get('epic_id')
        if epic_id:
            return self.queryset.filter(epic_id=epic_id)
        return self.queryset


class UserStoryViewSet(ModelViewSet):
    queryset = UserStory.objects.all()
    serializer_class = UserStorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        sub_epic_id = self.request.query_params.get('sub_epic_id')
        if sub_epic_id:
            return self.queryset.filter(sub_epic_id=sub_epic_id)
        return self.queryset


class StoryTaskViewSet(ModelViewSet):
    queryset = StoryTask.objects.all()
    serializer_class = StoryTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_story_id = self.request.query_params.get('user_story_id')
        if user_story_id:
            return self.queryset.filter(user_story_id=user_story_id)
        return self.queryset

    @action(detail=False, methods=["get"], url_path="user-assigned")
    def user_assigned_tasks(self, request):
        """Get all tasks assigned to the current user across all projects"""
        try:
            current_user = request.user
            
            # Get all tasks assigned to the current user
            # We need to find tasks where the assignee's user matches the current user
            assigned_tasks = StoryTask.objects.filter(
                assignee__user=current_user
            ).select_related(
                'assignee',
                'user_story__sub_epic__epic__project'
            ).order_by('-id')
            
            # Format the response to match the mobile app's expected structure
            tasks_data = []
            for task in assigned_tasks:
                assignee = task.assignee
                project = task.user_story.sub_epic.epic.project
                
                tasks_data.append({
                    'id': task.id,
                    'title': task.title,
                    'status': task.status,
                    'user_story_id': task.user_story.id,
                    'is_ai': task.ai,
                    'assignee_id': assignee.id if assignee else None,
                    'assignee_name': assignee.user_email if assignee else None,  # Use email for consistency
                    'project_id': project.id,
                    'project_title': project.title,
                    'epic_title': task.user_story.sub_epic.epic.title,
                    'user_story_title': task.user_story.title,
                })
            
            return Response({
                'tasks': tasks_data,
                'total_count': len(tasks_data),
                'user_email': current_user.email,
                'user_name': current_user.name,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch user tasks: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=["get"], url_path="recent-completed")
    def recent_completed_tasks(self, request):
        """Get recent completed tasks with user information for activity feed"""
        try:
            # First, let's check if there are any StoryTask objects at all
            total_tasks = StoryTask.objects.count()
            
            # Get recently completed tasks across all projects where user is a member
            completed_tasks = StoryTask.objects.filter(
                status='completed',
                assignee__isnull=False
            ).select_related(
                'assignee',
                'assignee__user',
                'user_story__sub_epic__epic__project'
            ).order_by('-id')[:10]  # Get last 10 completed tasks
            
            # Format the response for activity feed
            activities_data = []
            for task in completed_tasks:
                try:
                    assignee = task.assignee
                    if assignee and assignee.user:  # Only include tasks with valid assignees
                        # Since there's no updated_at field, we'll use a mock timestamp based on task ID
                        from datetime import datetime, timedelta
                        mock_timestamp = datetime.now() - timedelta(hours=task.id % 24)
                        
                        # Safe field access with fallbacks
                        user_name = getattr(assignee, 'user_name', None) or getattr(assignee.user, 'name', 'Unknown User')
                        user_email = getattr(assignee, 'user_email', None) or getattr(assignee.user, 'email', 'unknown@example.com')
                        project_title = getattr(task.user_story.sub_epic.epic.project, 'title', 'Unknown Project')
                        
                        activities_data.append({
                            'id': task.id,
                            'title': task.title or 'Untitled Task',
                            'status': task.status or 'completed',
                            'completed_at': mock_timestamp.isoformat(),
                            'user_id': str(assignee.user.id),
                            'user_name': user_name,
                            'user_email': user_email,
                            'project_title': project_title,
                        })
                except Exception as task_error:
                    # Skip this task if there's an error processing it
                    print(f"Error processing task {task.id}: {task_error}")
                    continue
            
            # Always return success, even if no activities
            return Response({
                'activities': activities_data,
                'total_count': len(activities_data),
                'total_tasks_in_db': total_tasks,
                'message': 'No completed tasks found' if len(activities_data) == 0 else f'Found {len(activities_data)} activities'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            error_details = {
                "error": f"Failed to fetch recent activities: {str(e)}",
                "traceback": traceback.format_exc(),
                "activities": [],  # Return empty list on error
                "total_count": 0
            }
            return Response(error_details, status=status.HTTP_200_OK)  # Return 200 with error details

    def create(self, request, *args, **kwargs):
        try:
            # Get the user story and check if the current user is the project creator
            user_story_id = request.data.get('user_story')
            if not user_story_id:
                return Response(
                    {"error": "User story ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                user_story = UserStory.objects.get(id=user_story_id)
                project = user_story.sub_epic.epic.project
            except (UserStory.DoesNotExist, AttributeError):
                return Response(
                    {"error": "User story not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if the current user is the project creator
            if project.created_by != request.user:
                return Response(
                    {"error": "Only the project creator can add tasks"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["post"], url_path="bulk-assign")
    def bulk_assign(self, request):
        try:
            assignments = request.data.get('assignments', [])
            if not isinstance(assignments, list):
                return Response({"error": "assignments must be a list"}, status=status.HTTP_400_BAD_REQUEST)

            updated = 0
            for item in assignments:
                task_id = item.get('task_id')
                assignee_id = item.get('assignee_id')
                if not task_id:
                    continue
                try:
                    task = StoryTask.objects.get(id=task_id)
                except StoryTask.DoesNotExist:
                    continue
                if assignee_id is None:
                    task.assignee = None
                else:
                    try:
                        member = ProjectMember.objects.get(id=assignee_id)
                    except ProjectMember.DoesNotExist:
                        continue
                    # Optional: ensure member belongs to same project
                    if member.project_id != task.user_story.sub_epic.epic.project_id:
                        continue
                    task.assignee = member
                task.save(update_fields=["assignee"])
                updated += 1

            return Response({"updated": updated}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        try:
            # Get the task and check if the current user is the project creator
            task = self.get_object()
            project = task.user_story.sub_epic.epic.project
            
            # Check if the current user is the project creator
            if project.created_by != request.user:
                return Response(
                    {"error": "Only the project creator can remove tasks"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProjectMemberViewSet(ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            # Get the project and check if the current user is the creator
            project_id = request.data.get('project')
            if not project_id:
                return Response(
                    {"error": "Project ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if the current user is the project creator
            if project.created_by != request.user:
                return Response(
                    {"error": "Only the project creator can add members"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if the user exists in the database
            user_email = request.data.get('user_email')
            if user_email:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                try:
                    existing_user = User.objects.get(email=user_email)
                    # Update the user field to use the existing user
                    request.data['user'] = existing_user.user_id
                    request.data['user_name'] = existing_user.name
                    request.data['user_email'] = existing_user.email
                except User.DoesNotExist:
                    # User doesn't exist, we need to create a new User first
                    # Generate a unique user ID that doesn't conflict with existing ones
                    import hashlib
                    base_id = int(hashlib.md5(user_email.encode()).hexdigest()[:8], 16) % 10000 + 1000
                    
                    # Find a unique user_id that doesn't exist
                    user_id = base_id
                    while User.objects.filter(user_id=user_id).exists():
                        user_id += 1
                    
                    # Create the new user
                    new_user = User.objects.create(
                        user_id=user_id,
                        email=user_email,
                        name=request.data.get('user_name', 'Unknown User'),
                        password='dummy_password'  # This won't be used for authentication
                    )
                    
                    # Update the request data to use the new user
                    request.data['user'] = new_user.user_id
                    request.data['user_name'] = new_user.name
                    request.data['user_email'] = new_user.email
            
            return super().create(request, *args, **kwargs)
        except Exception as e:
            if 'unique' in str(e).lower():
                return Response(
                    {"error": "This user is already a member of this project"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            raise e

    def destroy(self, request, *args, **kwargs):
        try:
            # Get the project member and check if the current user is the project creator
            member = self.get_object()
            project = member.project
            
            # Check if the current user is the project creator
            if project.created_by != request.user:
                return Response(
                    {"error": "Only the project creator can remove members"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return super().destroy(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProjectInvitationViewSet(ModelViewSet):
    queryset = ProjectInvitation.objects.all()
    serializer_class = ProjectInvitationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        project_id = self.request.query_params.get('project_id')
        if project_id:
            return self.queryset.filter(project_id=project_id)
        return self.queryset

    def create(self, request, *args, **kwargs):
        try:
            # Get the project and check permissions
            project_id = request.data.get('project')
            if not project_id:
                return Response(
                    {"error": "Project ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {"error": "Project not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if the current user can invite (project creator only for now)
            if project.created_by != request.user:
                return Response(
                    {"error": "Only the project creator can send invitations"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Set the invited_by field
            request.data['invited_by'] = request.user.id
            
            return super().create(request, *args, **kwargs)
        except Exception as e:
            if 'unique' in str(e).lower():
                return Response(
                    {"error": "A pending invitation already exists for this user"},
                    status=status.HTTP_409_CONFLICT
                )
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='accept')
    def accept_invitation(self, request, pk=None):
        """Accept a project invitation"""
        try:
            invitation = self.get_object()
            
            # Check if the current user is the invitee
            if invitation.invitee != request.user:
                return Response(
                    {"error": "You can only accept invitations sent to you"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if invitation is still pending
            if invitation.status != 'pending':
                return Response(
                    {"error": f"Invitation has already been {invitation.status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Transactionally accept invitation and create membership
            from django.db import transaction
            
            with transaction.atomic():
                # Update invitation status
                invitation.status = 'accepted'
                invitation.save(update_fields=['status', 'updated_at'])
                
                # Create project membership if it doesn't exist
                project_member, created = ProjectMember.objects.get_or_create(
                    project=invitation.project,
                    user=invitation.invitee,
                    defaults={
                        'user_name': invitation.invitee.name,
                        'user_email': invitation.invitee.email,
                        'role': 'Member'
                    }
                )
                
                if not created:
                    # Update existing membership with latest user info
                    project_member.user_name = invitation.invitee.name
                    project_member.user_email = invitation.invitee.email
                    project_member.save(update_fields=['user_name', 'user_email'])
            
            return Response({
                "message": "Invitation accepted successfully",
                "membership_created": created,
                "project_id": invitation.project.id,
                "project_title": invitation.project.title
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='decline')
    def decline_invitation(self, request, pk=None):
        """Decline a project invitation"""
        try:
            invitation = self.get_object()
            
            # Check if the current user is the invitee
            if invitation.invitee != request.user:
                return Response(
                    {"error": "You can only decline invitations sent to you"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if invitation is still pending
            if invitation.status != 'pending':
                return Response(
                    {"error": f"Invitation has already been {invitation.status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update invitation status
            invitation.status = 'declined'
            invitation.save(update_fields=['status', 'updated_at'])
            
            return Response({
                "message": "Invitation declined successfully",
                "project_id": invitation.project.id,
                "project_title": invitation.project.title
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='my-invitations')
    def my_invitations(self, request):
        """Get all invitations for the current user"""
        try:
            invitations = ProjectInvitation.objects.filter(
                invitee=request.user,
                status='pending'
            ).select_related('project', 'invited_by').order_by('-created_at')
            
            serializer = self.get_serializer(invitations, many=True)
            return Response({
                "invitations": serializer.data,
                "count": len(serializer.data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


