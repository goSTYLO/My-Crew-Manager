import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.contenttypes.models import ContentType
from apps.ai_api.models import ProjectMember, Project, Epic, SubEpic, UserStory, StoryTask, Repository
from .notification_service import NotificationService

logger = logging.getLogger('core.services')


class BroadcastService:
    """Service for broadcasting real-time updates to project members via WebSocket"""
    
    @staticmethod
    def get_project_member_user_ids(project_id):
        """Get all user IDs who are members of the project"""
        return list(ProjectMember.objects.filter(project_id=project_id).values_list('user_id', flat=True))
    
    @staticmethod
    def broadcast_to_project(project_id, event_type, action, data, actor):
        """Broadcast an event to all project members"""
        try:
            user_ids = BroadcastService.get_project_member_user_ids(project_id)
            
            if not user_ids:
                return
            
            # Simplified event payload
            event_payload = {
                'type': event_type,
                'action': action,
                'project_id': project_id,
                'data': data,
                'actor': {
                    'id': actor.user_id if hasattr(actor, 'user_id') else actor.id,
                    'name': actor.name if hasattr(actor, 'name') else str(actor)
                }
            }
            
            channel_layer = get_channel_layer()
            for user_id in user_ids:
                group_name = f'user_{user_id}_updates'
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'project_event',  # Single handler type
                        'data': event_payload
                    }
                )
            
            logger.info(f"Broadcasted {event_type} to {len(user_ids)} members")
            
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
    
    # Project-related broadcasts
    @staticmethod
    def broadcast_project_update(project, action, actor):
        """Broadcast project metadata changes"""
        from apps.ai_api.serializers import ProjectSerializer
        serializer = ProjectSerializer(project)
        BroadcastService.broadcast_to_project(
            project.id, 'project_update', action, serializer.data, actor
        )
    
    @staticmethod
    def broadcast_overview_regenerated(project, actor):
        """Broadcast when project overview is regenerated"""
        BroadcastService.broadcast_to_project(
            project.id, 'overview_regenerated', 'regenerated', 
            {'project_id': project.id, 'title': project.title}, actor
        )
    
    @staticmethod
    def broadcast_backlog_regenerated(project, actor):
        """Broadcast when project backlog is regenerated"""
        BroadcastService.broadcast_to_project(
            project.id, 'backlog_regenerated', 'regenerated',
            {'project_id': project.id, 'title': project.title}, actor
        )
    
    # Epic-related broadcasts
    @staticmethod
    def broadcast_epic_update(epic, action, actor):
        """Broadcast epic changes"""
        from apps.ai_api.serializers import EpicSerializer
        serializer = EpicSerializer(epic)
        BroadcastService.broadcast_to_project(
            epic.project.id, 'epic_update', action, serializer.data, actor
        )
    
    # Sub-epic-related broadcasts
    @staticmethod
    def broadcast_sub_epic_update(sub_epic, action, actor):
        """Broadcast sub-epic changes"""
        from apps.ai_api.serializers import SubEpicSerializer
        serializer = SubEpicSerializer(sub_epic)
        BroadcastService.broadcast_to_project(
            sub_epic.epic.project.id, 'sub_epic_update', action, serializer.data, actor
        )
    
    # User story-related broadcasts
    @staticmethod
    def broadcast_user_story_update(user_story, action, actor):
        """Broadcast user story changes"""
        from apps.ai_api.serializers import UserStorySerializer
        serializer = UserStorySerializer(user_story)
        BroadcastService.broadcast_to_project(
            user_story.sub_epic.epic.project.id, 'user_story_update', action, serializer.data, actor
        )
    
    # Task-related broadcasts
    @staticmethod
    def broadcast_task_update(task, action, actor):
        """Broadcast task changes"""
        from apps.ai_api.serializers import StoryTaskSerializer
        serializer = StoryTaskSerializer(task)
        BroadcastService.broadcast_to_project(
            task.user_story.sub_epic.epic.project.id, 'task_update', action, serializer.data, actor
        )
    
    # Member-related broadcasts
    @staticmethod
    def broadcast_member_update(project_member, action, actor):
        """Broadcast member changes"""
        from apps.ai_api.serializers import ProjectMemberSerializer
        serializer = ProjectMemberSerializer(project_member)
        BroadcastService.broadcast_to_project(
            project_member.project.id, 'member_update', action, serializer.data, actor
        )
    
    # Repository-related broadcasts
    @staticmethod
    def broadcast_repository_update(repository, action, actor):
        """Broadcast repository changes"""
        from apps.ai_api.serializers import RepositorySerializer
        serializer = RepositorySerializer(repository)
        BroadcastService.broadcast_to_project(
            repository.project.id, 'repository_update', action, serializer.data, actor
        )
    
    # Notification integration
    @staticmethod
    def broadcast_with_notification(project_id, event_type, action, data, actor, notification_type=None, notification_title=None, notification_message=None):
        """Broadcast event and optionally create a notification"""
        # Broadcast the real-time update
        BroadcastService.broadcast_to_project(project_id, event_type, action, data, actor)
        
        # Create notification if specified
        if notification_type and notification_title and notification_message:
            try:
                # Get all project members except the actor
                members = ProjectMember.objects.filter(project_id=project_id).exclude(user=actor)
                for member in members:
                    NotificationService.create_notification(
                        recipient=member.user,
                        notification_type=notification_type,
                        title=notification_title,
                        message=notification_message,
                        content_object=data.get('content_object') if isinstance(data, dict) else None,
                        action_url=data.get('action_url') if isinstance(data, dict) else None,
                        actor=actor
                    )
            except Exception as e:
                logger.error(f"Error creating notifications for {event_type}: {e}")
