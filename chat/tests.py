from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from chat.models import Room, RoomMembership, Message


User = get_user_model()


class ChatApiTests(TestCase):
    def setUp(self):
        # Users
        self.user_owner = User.objects.create_user(email='owner@example.com', name='Owner', password='pass123')
        self.user_member = User.objects.create_user(email='member@example.com', name='Member', password='pass123')
        self.user_other = User.objects.create_user(email='other@example.com', name='Other', password='pass123')

        # Tokens
        self.owner_token = Token.objects.create(user=self.user_owner)
        self.member_token = Token.objects.create(user=self.user_member)
        self.other_token = Token.objects.create(user=self.user_other)

        # API clients
        self.client_owner = APIClient()
        self.client_member = APIClient()
        self.client_other = APIClient()
        self.client_owner.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        self.client_member.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')
        self.client_other.credentials(HTTP_AUTHORIZATION=f'Token {self.other_token.key}')

        self.base = '/api/chat'

    def test_room_crud_and_membership(self):
        # Create room (owner becomes admin and member)
        resp = self.client_owner.post(f'{self.base}/rooms/', {
            'name': 'Design',
            'is_private': False,
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        room_id = resp.data['room_id']
        room = Room.objects.get(pk=room_id)
        self.assertTrue(RoomMembership.objects.filter(room=room, user=self.user_owner, is_admin=True).exists())

        # Owner can list own rooms
        resp = self.client_owner.get(f'{self.base}/rooms/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

        # Member not in room cannot see the room
        resp = self.client_member.get(f'{self.base}/rooms/')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(all(r['room_id'] != room_id for r in resp.data))

        # Owner invites member
        resp = self.client_owner.post(f'{self.base}/rooms/{room_id}/invite/', {
            'user_id': self.user_member.pk,
        }, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)
        self.assertTrue(RoomMembership.objects.filter(room=room, user=self.user_member).exists())

        # Non-admin cannot invite
        resp = self.client_member.post(f'{self.base}/rooms/{room_id}/invite/', {
            'user_id': self.user_other.pk,
        }, format='json')
        self.assertIn(resp.status_code, (403, 404))

        # Owner can view members
        resp = self.client_owner.get(f'{self.base}/rooms/{room_id}/members/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

        # Owner removes member
        resp = self.client_owner.post(f'{self.base}/rooms/{room_id}/remove_member/', {
            'user_id': self.user_member.pk,
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(RoomMembership.objects.filter(room=room, user=self.user_member).exists())

    def test_direct_room_endpoint(self):
        # Owner creates/gets direct room with member
        resp = self.client_owner.post(f'{self.base}/rooms/direct/', {
            'user_id': self.user_member.pk,
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        room_id = resp.data['room_id']
        # Calling again returns same room (200 OK implied by serializer response)
        resp2 = self.client_owner.post(f'{self.base}/rooms/direct/', {
            'user_id': self.user_member.pk,
        }, format='json')
        # Endpoint returns existing room with 200 when found, 201 when created
        self.assertIn(resp2.status_code, (200, 201), resp2.content)
        self.assertEqual(resp2.data['room_id'], room_id)

    def test_messages_list_create_delete_and_permissions(self):
        # Create a room as owner (admin)
        resp = self.client_owner.post(f'{self.base}/rooms/', {
            'name': 'Dev',
            'is_private': True,
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        room_id = resp.data['room_id']

        # Non-member cannot list messages
        resp = self.client_other.get(f'{self.base}/rooms/{room_id}/messages/')
        self.assertIn(resp.status_code, (403, 404))

        # Owner can create message
        resp = self.client_owner.post(f'{self.base}/rooms/{room_id}/messages/', {
            'content': 'Hello world',
            'message_type': 'text',
        }, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        msg_id = resp.data['message_id']

        # Owner lists messages
        resp = self.client_owner.get(f'{self.base}/rooms/{room_id}/messages/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

        # Another user (non-member) cannot delete
        resp = self.client_other.delete(f'{self.base}/rooms/{room_id}/messages/{msg_id}/')
        self.assertIn(resp.status_code, (403, 404))

        # Owner soft-deletes own message
        resp = self.client_owner.delete(f'{self.base}/rooms/{room_id}/messages/{msg_id}/')
        self.assertEqual(resp.status_code, 204, resp.content)
        self.assertTrue(Message.objects.filter(message_id=msg_id, is_deleted=True).exists())

    def test_message_reply_validation_same_room(self):
        # Create a room and message
        resp = self.client_owner.post(f'{self.base}/rooms/', {
            'name': 'QA',
            'is_private': True,
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        room_id = resp.data['room_id']
        resp = self.client_owner.post(f'{self.base}/rooms/{room_id}/messages/', {
            'content': 'Root',
            'message_type': 'text',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        root_msg_id = resp.data['message_id']

        # Create another room and try to reply across rooms (should fail)
        resp2 = self.client_owner.post(f'{self.base}/rooms/', {
            'name': 'QA-2',
            'is_private': True,
        }, format='json')
        self.assertEqual(resp2.status_code, 201)
        other_room_id = resp2.data['room_id']

        resp = self.client_owner.post(f'{self.base}/rooms/{other_room_id}/messages/', {
            'content': 'Bad reply',
            'message_type': 'text',
            'reply_to_id': root_msg_id,
        }, format='json')
        # Validation error
        self.assertEqual(resp.status_code, 400)

# Create your tests here.
