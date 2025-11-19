from django.contrib.auth.models import Group, User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from properties.models import AgentProfile


class CurrentUserProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='jane',
            email='jane@example.com',
            password='testpass123',
            first_name='Jane',
            last_name='Smith',
        )
        self.client.force_authenticate(self.user)

    def test_get_profile_includes_nested_user(self):
        url = reverse('accounts:me')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'jane')
        self.assertTrue(response.data['profile'] is not None)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'jane@example.com')

    def test_update_profile_updates_user_and_profile_fields(self):
        url = reverse('accounts:me')
        payload = {
            'user': {
                'first_name': 'Janet',
                'last_name': 'Doe',
            },
            'profile': {
                'name': 'Janet Doe',
                'phone_number': '+255700000000',
                'address': 'Dar es Salaam',
            }
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Janet')
        self.assertEqual(self.user.profile.phone_number, '+255700000000')
        self.assertEqual(self.user.profile.address, 'Dar es Salaam')


class AgentProfileUpdateTests(APITestCase):
    def setUp(self):
        self.agent = User.objects.create_user(
            username='agentuser',
            email='agent@example.com',
            password='agentpass123',
        )
        agent_group, _ = Group.objects.get_or_create(name='agent')
        self.agent.groups.add(agent_group)
        AgentProfile.objects.create(user=self.agent, profile=self.agent.profile)
        self.client.force_authenticate(self.agent)

    def test_agent_can_update_agency_details(self):
        url = reverse('accounts:me')
        payload = {
            'agent_profile': {
                'agency_name': 'Smart Realty',
                'phone': '+255755000111',
            }
        }
        response = self.client.patch(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.agent.refresh_from_db()
        self.assertEqual(self.agent.agentprofile.agency_name, 'Smart Realty')
        self.assertEqual(self.agent.agentprofile.phone, '+255755000111')
