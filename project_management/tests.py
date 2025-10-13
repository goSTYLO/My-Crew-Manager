from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from django.utils import timezone
from datetime import date, timedelta

from .models import Team, TeamMember, Project, Sprint, Task


User = get_user_model()


class ProjectManagementApiTests(TestCase):
    def setUp(self):
        # Users
        self.owner = User.objects.create_user(email='owner@example.com', name='Owner', password='pass123')
        self.member = User.objects.create_user(email='member@example.com', name='Member', password='pass123')
        self.other = User.objects.create_user(email='other@example.com', name='Other', password='pass123')

        # Tokens/clients
        self.owner_token = Token.objects.create(user=self.owner)
        self.member_token = Token.objects.create(user=self.member)
        self.other_token = Token.objects.create(user=self.other)

        self.c_owner = APIClient(); self.c_owner.credentials(HTTP_AUTHORIZATION=f'Token {self.owner_token.key}')
        self.c_member = APIClient(); self.c_member.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')
        self.c_other = APIClient(); self.c_other.credentials(HTTP_AUTHORIZATION=f'Token {self.other_token.key}')

        self.base = '/api/project-management'

        # Team and membership
        self.team = Team.objects.create(name='Alpha')
        TeamMember.objects.create(team=self.team, user=self.owner, role_in_team='owner')

        # Project under team
        self.project = Project.objects.create(
            name='Proj', description='desc',
            start_date=date.today(), end_date=date.today() + timedelta(days=10),
            team=self.team
        )

        # Sprint under project
        self.sprint = Sprint.objects.create(
            title='S1', start_date=date.today(), end_date=date.today() + timedelta(days=7),
            project=self.project
        )

        # Task under sprint
        self.task = Task.objects.create(title='T1', sprint=self.sprint, points=3)

    def test_scoped_list_visibility(self):
        # Owner sees team/project/sprint/task
        self.assertGreater(len(self.c_owner.get(f'{self.base}/teams/').json()), 0)
        self.assertGreater(len(self.c_owner.get(f'{self.base}/projects/').json()), 0)
        self.assertGreater(len(self.c_owner.get(f'{self.base}/sprints/').json()), 0)
        self.assertGreater(len(self.c_owner.get(f'{self.base}/tasks/').json()), 0)

        # Other (not member) sees nothing
        self.assertEqual(len(self.c_other.get(f'{self.base}/teams/').json()), 0)
        self.assertEqual(len(self.c_other.get(f'{self.base}/projects/').json()), 0)
        self.assertEqual(len(self.c_other.get(f'{self.base}/sprints/').json()), 0)
        self.assertEqual(len(self.c_other.get(f'{self.base}/tasks/').json()), 0)

    def test_team_add_and_remove_member(self):
        # Add member
        resp = self.c_owner.post(f'{self.base}/teams/{self.team.team_id}/add_member/', {
            'user_id': self.member.user_id,
            'role_in_team': 'dev'
        }, format='json')
        self.assertIn(resp.status_code, (200, 201), resp.content)

        # Member now can see the project assets
        self.assertGreater(len(self.c_member.get(f'{self.base}/projects/').json()), 0)

        # Remove member
        resp = self.c_owner.delete(f'{self.base}/teams/{self.team.team_id}/remove_member/', {
            'user_id': self.member.user_id,
        }, format='json')
        self.assertEqual(resp.status_code, 200, resp.content)

    def test_project_and_sprint_date_validation(self):
        # Invalid project dates
        bad = self.c_owner.post(f'{self.base}/projects/', {
            'name': 'Bad', 'team': self.team.team_id,
            'start_date': str(date.today() + timedelta(days=2)),
            'end_date': str(date.today()),
        }, format='json')
        self.assertEqual(bad.status_code, 400)

        # Invalid sprint dates
        bad2 = self.c_owner.post(f'{self.base}/sprints/', {
            'title': 'S2', 'project': self.project.project_id,
            'start_date': str(date.today() + timedelta(days=5)),
            'end_date': str(date.today()),
        }, format='json')
        self.assertEqual(bad2.status_code, 400)


# Create your tests here.
