from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

from .models import Project, ProjectInvitation, Notification, ProjectMember
from .consumers import NotificationConsumer
from .services.notification_service import NotificationService

User = get_user_model()


class NotificationModelTests(TestCase):
    """Test basic notification model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.project = Project.objects.create(
            title='Test Project',
            summary='Test project summary',
            created_by=self.user
        )
    
    def test_notification_creation_with_required_fields(self):
        """Test notification can be created with all required fields"""
        notification = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='This is a test notification'
        )
        
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.notification_type, 'project_invitation')
        self.assertEqual(notification.title, 'Test Notification')
        self.assertEqual(notification.message, 'This is a test notification')
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
        self.assertIsNotNone(notification.created_at)
    
    def test_notification_type_choices(self):
        """Test all notification type choices are valid"""
        valid_types = [
            'project_invitation', 'task_assigned', 'task_updated',
            'task_completed', 'mention', 'deadline_reminder',
            'project_update', 'member_joined', 'member_left'
        ]
        
        for notification_type in valid_types:
            notification = Notification.objects.create(
                recipient=self.user,
                notification_type=notification_type,
                title=f'Test {notification_type}',
                message=f'Test message for {notification_type}'
            )
            self.assertEqual(notification.notification_type, notification_type)
    
    def test_generic_foreign_key_relationship(self):
        """Test notification can be linked to any model via generic FK"""
        invitation = ProjectInvitation.objects.create(
            project=self.project,
            invitee=self.user,
            invited_by=self.user,
            message='Test invitation'
        )
        
        notification = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='Test message',
            content_object=invitation
        )
        
        self.assertEqual(notification.content_object, invitation)
        self.assertEqual(notification.content_type, ContentType.objects.get_for_model(invitation))
        self.assertEqual(notification.object_id, invitation.id)
    
    def test_default_values(self):
        """Test notification default values"""
        notification = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='Test message'
        )
        
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
        self.assertIsNotNone(notification.created_at)
    
    def test_ordering_by_created_at(self):
        """Test notifications are ordered by created_at descending"""
        # Create notifications with slight time differences
        notification1 = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='First Notification',
            message='First message'
        )
        
        notification2 = Notification.objects.create(
            recipient=self.user,
            notification_type='task_assigned',
            title='Second Notification',
            message='Second message'
        )
        
        notifications = Notification.objects.filter(recipient=self.user)
        self.assertEqual(notifications[0], notification2)  # Most recent first
        self.assertEqual(notifications[1], notification1)


class NotificationServiceTests(TestCase):
    """Test notification service layer logic"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.project = Project.objects.create(
            title='Test Project',
            summary='Test project summary',
            created_by=self.user
        )
    
    @patch('ai_api.services.notification_service.NotificationService.send_realtime_notification')
    def test_create_notification_creates_database_record(self, mock_send):
        """Test create_notification creates database record"""
        notification = NotificationService.create_notification(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='Test message'
        )
        
        self.assertIsInstance(notification, Notification)
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.notification_type, 'project_invitation')
        self.assertEqual(notification.title, 'Test Notification')
        self.assertEqual(notification.message, 'Test message')
        
        # Verify it was saved to database
        self.assertTrue(Notification.objects.filter(id=notification.id).exists())
    
    @patch('ai_api.services.notification_service.NotificationService.send_realtime_notification')
    def test_create_notification_triggers_websocket_send(self, mock_send):
        """Test create_notification triggers WebSocket send"""
        NotificationService.create_notification(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='Test message'
        )
        
        mock_send.assert_called_once()
    
    def test_mark_as_read_updates_fields(self):
        """Test mark_as_read updates is_read and read_at"""
        notification = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='Test message'
        )
        
        result = NotificationService.mark_as_read(notification.id, self.user)
        
        self.assertTrue(result.is_read)
        self.assertIsNotNone(result.read_at)
        
        # Verify in database
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)
    
    def test_mark_all_as_read_bulk_update(self):
        """Test mark_all_as_read updates all unread notifications"""
        # Create multiple unread notifications
        for i in range(3):
            Notification.objects.create(
                recipient=self.user,
                notification_type='project_invitation',
                title=f'Test Notification {i}',
                message=f'Test message {i}'
            )
        
        # Mark one as read manually
        Notification.objects.filter(recipient=self.user).first().is_read = True
        
        NotificationService.mark_all_as_read(self.user)
        
        # All should now be read
        unread_count = Notification.objects.filter(recipient=self.user, is_read=False).count()
        self.assertEqual(unread_count, 0)
    
    @patch('ai_api.services.notification_service.async_to_sync')
    def test_websocket_payload_structure(self, mock_async_to_sync):
        """Test WebSocket payload has correct structure"""
        notification = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='Test message',
            action_url='/test/url'
        )
        
        NotificationService.send_realtime_notification(notification)
        
        # Verify the payload structure
        mock_async_to_sync.assert_called_once()
        call_args = mock_async_to_sync.call_args[0][0]
        
        # Check the group_send call
        group_send_call = call_args
        self.assertEqual(group_send_call['type'], 'notification_message')
        
        payload = group_send_call['notification']
        self.assertEqual(payload['id'], notification.id)
        self.assertEqual(payload['type'], 'project_invitation')
        self.assertEqual(payload['title'], 'Test Notification')
        self.assertEqual(payload['message'], 'Test message')
        self.assertEqual(payload['action_url'], '/test/url')
        self.assertFalse(payload['is_read'])


class NotificationAPITests(APITestCase):
    """Test notification API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123'
        )
        
        # Create test notifications
        self.notification1 = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification 1',
            message='Test message 1'
        )
        self.notification2 = Notification.objects.create(
            recipient=self.user,
            notification_type='task_assigned',
            title='Test Notification 2',
            message='Test message 2'
        )
        self.other_notification = Notification.objects.create(
            recipient=self.other_user,
            notification_type='project_invitation',
            title='Other User Notification',
            message='Other user message'
        )
    
    def test_get_notifications_requires_authentication(self):
        """Test GET notifications requires authentication"""
        response = self.client.get('/api/ai/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_notifications_returns_user_notifications_only(self):
        """Test GET notifications returns only user's notifications"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/ai/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Verify only user's notifications are returned
        notification_ids = [n['id'] for n in response.data]
        self.assertIn(self.notification1.id, notification_ids)
        self.assertIn(self.notification2.id, notification_ids)
        self.assertNotIn(self.other_notification.id, notification_ids)
    
    def test_get_unread_count_requires_authentication(self):
        """Test GET unread count requires authentication"""
        response = self.client.get('/api/ai/notifications/unread_count/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_unread_count_returns_correct_count(self):
        """Test GET unread count returns correct count"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/ai/notifications/unread_count/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 2)  # Both notifications are unread
        
        # Mark one as read and test again
        self.notification1.is_read = True
        self.notification1.save()
        
        response = self.client.get('/api/ai/notifications/unread_count/')
        self.assertEqual(response.data['unread_count'], 1)
    
    def test_mark_read_requires_authentication(self):
        """Test POST mark read requires authentication"""
        response = self.client.post(f'/api/ai/notifications/{self.notification1.id}/mark_read/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_mark_read_marks_single_notification(self):
        """Test POST mark read marks single notification"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f'/api/ai/notifications/{self.notification1.id}/mark_read/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'marked as read')
        
        # Verify notification is marked as read
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertIsNotNone(self.notification1.read_at)
    
    def test_mark_read_only_works_for_user_own_notifications(self):
        """Test users can only mark their own notifications as read"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f'/api/ai/notifications/{self.other_notification.id}/mark_read/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_mark_all_read_requires_authentication(self):
        """Test POST mark all read requires authentication"""
        response = self.client.post('/api/ai/notifications/mark_all_read/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_mark_all_read_marks_all_notifications(self):
        """Test POST mark all read marks all user notifications"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/ai/notifications/mark_all_read/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'all marked as read')
        
        # Verify all notifications are marked as read
        unread_count = Notification.objects.filter(recipient=self.user, is_read=False).count()
        self.assertEqual(unread_count, 0)


class ProjectInvitationNotificationTests(APITestCase):
    """Test project invitation notification flow"""
    
    def setUp(self):
        self.inviter = User.objects.create_user(
            email='inviter@example.com',
            name='Inviter User',
            password='testpass123'
        )
        self.invitee = User.objects.create_user(
            email='invitee@example.com',
            name='Invitee User',
            password='testpass123'
        )
        self.project = Project.objects.create(
            title='Test Project',
            summary='Test project summary',
            created_by=self.inviter
        )
    
    @patch('ai_api.services.notification_service.NotificationService.send_realtime_notification')
    def test_invitation_creation_triggers_notification(self, mock_send):
        """Test invitation creation triggers notification"""
        self.client.force_authenticate(user=self.inviter)
        
        response = self.client.post('/api/ai/invitations/', {
            'project': self.project.id,
            'invitee': self.invitee.id,
            'message': 'Join our project!'
        })
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify notification was created
        notification = Notification.objects.filter(
            recipient=self.invitee,
            notification_type='project_invitation'
        ).first()
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, f'Project Invitation: {self.project.title}')
        self.assertIn(self.project.title, notification.message)
        self.assertIn(self.inviter.name, notification.message)
        
        # Verify WebSocket was called
        mock_send.assert_called_once()
    
    def test_notification_has_correct_type(self):
        """Test notification has correct type"""
        self.client.force_authenticate(user=self.inviter)
        
        self.client.post('/api/ai/invitations/', {
            'project': self.project.id,
            'invitee': self.invitee.id,
            'message': 'Join our project!'
        })
        
        notification = Notification.objects.filter(recipient=self.invitee).first()
        self.assertEqual(notification.notification_type, 'project_invitation')
    
    def test_notification_has_correct_recipient(self):
        """Test notification has correct recipient"""
        self.client.force_authenticate(user=self.inviter)
        
        self.client.post('/api/ai/invitations/', {
            'project': self.project.id,
            'invitee': self.invitee.id,
            'message': 'Join our project!'
        })
        
        notification = Notification.objects.filter(recipient=self.invitee).first()
        self.assertEqual(notification.recipient, self.invitee)
    
    def test_notification_has_correct_actor(self):
        """Test notification has correct actor"""
        self.client.force_authenticate(user=self.inviter)
        
        self.client.post('/api/ai/invitations/', {
            'project': self.project.id,
            'invitee': self.invitee.id,
            'message': 'Join our project!'
        })
        
        notification = Notification.objects.filter(recipient=self.invitee).first()
        self.assertEqual(notification.actor, self.inviter)
    
    def test_notification_message_includes_project_title(self):
        """Test notification message includes project title"""
        self.client.force_authenticate(user=self.inviter)
        
        self.client.post('/api/ai/invitations/', {
            'project': self.project.id,
            'invitee': self.invitee.id,
            'message': 'Join our project!'
        })
        
        notification = Notification.objects.filter(recipient=self.invitee).first()
        self.assertIn(self.project.title, notification.message)
    
    def test_action_url_points_to_correct_page(self):
        """Test action_url points to correct invitation page"""
        self.client.force_authenticate(user=self.inviter)
        
        self.client.post('/api/ai/invitations/', {
            'project': self.project.id,
            'invitee': self.invitee.id,
            'message': 'Join our project!'
        })
        
        notification = Notification.objects.filter(recipient=self.invitee).first()
        expected_url = f'/projects/{self.project.id}/invitations'
        self.assertEqual(notification.action_url, expected_url)
    
    def test_notification_linked_to_invitation_via_generic_fk(self):
        """Test notification linked to invitation via generic FK"""
        self.client.force_authenticate(user=self.inviter)
        
        response = self.client.post('/api/ai/invitations/', {
            'project': self.project.id,
            'invitee': self.invitee.id,
            'message': 'Join our project!'
        })
        
        invitation_id = response.data['id']
        invitation = ProjectInvitation.objects.get(id=invitation_id)
        
        notification = Notification.objects.filter(recipient=self.invitee).first()
        self.assertEqual(notification.content_object, invitation)
        self.assertEqual(notification.content_type, ContentType.objects.get_for_model(invitation))
        self.assertEqual(notification.object_id, invitation.id)


class NotificationWebSocketTests(TransactionTestCase):
    """Test WebSocket real-time delivery"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            name='Test User',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            name='Other User',
            password='testpass123'
        )
    
    async def test_websocket_connection_requires_authentication(self):
        """Test WebSocket connection requires authentication"""
        communicator = WebsocketCommunicator(NotificationConsumer.as_asgi(), "/ws/notifications/")
        connected, subprotocol = await communicator.connect()
        
        # Should be rejected due to no authentication
        self.assertFalse(connected)
    
    async def test_authenticated_user_joins_correct_channel_group(self):
        """Test authenticated user joins correct channel group"""
        communicator = WebsocketCommunicator(NotificationConsumer.as_asgi(), "/ws/notifications/")
        communicator.scope["user"] = self.user
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Test that user is in the correct group
        channel_layer = get_channel_layer()
        group_name = f'user_{self.user.id}_notifications'
        
        # Send a test message to the group
        await channel_layer.group_send(group_name, {
            'type': 'notification_message',
            'notification': {
                'id': 1,
                'type': 'test',
                'title': 'Test',
                'message': 'Test message',
                'created_at': datetime.now().isoformat(),
                'is_read': False
            }
        })
        
        # Should receive the message
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'notification')
        
        await communicator.disconnect()
    
    async def test_notification_delivery_through_websocket(self):
        """Test notification delivery through WebSocket"""
        communicator = WebsocketCommunicator(NotificationConsumer.as_asgi(), "/ws/notifications/")
        communicator.scope["user"] = self.user
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Create a notification
        notification = Notification.objects.create(
            recipient=self.user,
            notification_type='project_invitation',
            title='Test Notification',
            message='Test message'
        )
        
        # Send notification through WebSocket
        channel_layer = get_channel_layer()
        group_name = f'user_{self.user.id}_notifications'
        
        await channel_layer.group_send(group_name, {
            'type': 'notification_message',
            'notification': {
                'id': notification.id,
                'type': notification.notification_type,
                'title': notification.title,
                'message': notification.message,
                'action_url': notification.action_url,
                'actor': notification.actor.name if notification.actor else None,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read,
            }
        })
        
        # Receive the notification
        response = await communicator.receive_json_from()
        
        self.assertEqual(response['type'], 'notification')
        self.assertEqual(response['notification']['id'], notification.id)
        self.assertEqual(response['notification']['type'], 'project_invitation')
        self.assertEqual(response['notification']['title'], 'Test Notification')
        self.assertEqual(response['notification']['message'], 'Test message')
        
        await communicator.disconnect()
    
    async def test_websocket_message_format_matches_expected_structure(self):
        """Test WebSocket message format matches expected structure"""
        communicator = WebsocketCommunicator(NotificationConsumer.as_asgi(), "/ws/notifications/")
        communicator.scope["user"] = self.user
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Send test message with expected structure
        channel_layer = get_channel_layer()
        group_name = f'user_{self.user.id}_notifications'
        
        test_notification = {
            'id': 123,
            'type': 'project_invitation',
            'title': 'Test Title',
            'message': 'Test Message',
            'action_url': '/test/url',
            'actor': 'Test Actor',
            'created_at': '2024-01-01T00:00:00Z',
            'is_read': False
        }
        
        await channel_layer.group_send(group_name, {
            'type': 'notification_message',
            'notification': test_notification
        })
        
        # Receive and verify structure
        response = await communicator.receive_json_from()
        
        self.assertIn('type', response)
        self.assertIn('notification', response)
        self.assertEqual(response['type'], 'notification')
        
        notification_data = response['notification']
        required_fields = ['id', 'type', 'title', 'message', 'created_at', 'is_read']
        for field in required_fields:
            self.assertIn(field, notification_data)
        
        await communicator.disconnect()
    
    async def test_multiple_users_receive_only_their_notifications(self):
        """Test multiple users receive only their own notifications"""
        # Connect two users
        communicator1 = WebsocketCommunicator(NotificationConsumer.as_asgi(), "/ws/notifications/")
        communicator1.scope["user"] = self.user
        
        communicator2 = WebsocketCommunicator(NotificationConsumer.as_asgi(), "/ws/notifications/")
        communicator2.scope["user"] = self.other_user
        
        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()
        
        self.assertTrue(connected1)
        self.assertTrue(connected2)
        
        # Send notification to user1 only
        channel_layer = get_channel_layer()
        group_name1 = f'user_{self.user.id}_notifications'
        
        await channel_layer.group_send(group_name1, {
            'type': 'notification_message',
            'notification': {
                'id': 1,
                'type': 'project_invitation',
                'title': 'User1 Notification',
                'message': 'This is for user1',
                'created_at': datetime.now().isoformat(),
                'is_read': False
            }
        })
        
        # User1 should receive the notification
        response1 = await communicator1.receive_json_from()
        self.assertEqual(response1['notification']['title'], 'User1 Notification')
        
        # User2 should not receive anything (with timeout)
        try:
            await communicator2.receive_json_from(timeout=0.1)
            self.fail("User2 should not have received a notification")
        except:
            pass  # Expected - no message for user2
        
        await communicator1.disconnect()
        await communicator2.disconnect()
    
    async def test_disconnect_cleanup(self):
        """Test disconnect cleanup removes user from channel group"""
        communicator = WebsocketCommunicator(NotificationConsumer.as_asgi(), "/ws/notifications/")
        communicator.scope["user"] = self.user
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        # Disconnect
        await communicator.disconnect()
        
        # Try to send message after disconnect - should not cause errors
        channel_layer = get_channel_layer()
        group_name = f'user_{self.user.id}_notifications'
        
        # This should not raise an exception
        await channel_layer.group_send(group_name, {
            'type': 'notification_message',
            'notification': {
                'id': 1,
                'type': 'test',
                'title': 'Test',
                'message': 'Test message',
                'created_at': datetime.now().isoformat(),
                'is_read': False
            }
        })
