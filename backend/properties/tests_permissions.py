from rest_framework.test import APITestCase
from django.contrib.auth.models import User, Group
from properties.models import Property, AgentProfile


class PropertyPermissionTest(APITestCase):
    def setUp(self):
        # Create regular user
        self.user = User.objects.create_user(username='regular', password='pass')
        # Create agent user and group
        self.agent = User.objects.create_user(username='agentuser', password='pass')
        agent_group, _ = Group.objects.get_or_create(name='agent')
        self.agent.groups.add(agent_group)
        # Ensure profile and agent profile exist
        try:
            _ = self.agent.profile
        except Exception:
            from accounts.models import Profile
            Profile.objects.create(user=self.agent)
        AgentProfile.objects.get_or_create(user=self.agent, profile=self.agent.profile)

        # Create a property owned by agent
        self.prop = Property.objects.create(
            owner=self.agent,
            title='Agent Prop',
            description='Owned by agent',
            price=100.0,
            type='House',
            area=50.0,
            rooms=2,
            bedrooms=1,
            bathrooms=1,
            city='City'
        )

    def test_regular_user_cannot_create_property(self):
        url = '/api/v1/properties/'
        self.client.login(username='regular', password='pass')
        resp = self.client.post(url, {
            'title': 'New', 'description': 'No', 'price': 10.0, 'type': 'House', 'area': 10.0, 'rooms':1, 'bedrooms':1, 'bathrooms':1, 'city':'C'
        }, format='json')
        # Should be forbidden (403) because regular user is not an agent
        self.assertIn(resp.status_code, (401, 403))

    def test_agent_can_create_property(self):
        url = '/api/v1/properties/'
        self.client.login(username='agentuser', password='pass')
        resp = self.client.post(url, {
            'title': 'Agent Created', 'description': 'OK', 'price': 20.0, 'type': 'House', 'area': 20.0, 'rooms':1, 'bedrooms':1, 'bathrooms':1, 'city':'C'
        }, format='json')
        self.assertIn(resp.status_code, (201, 200))

    def test_non_owner_cannot_update_property(self):
        url = f'/api/v1/properties/{self.prop.id}/'
        # regular user trying to update agent's property
        self.client.login(username='regular', password='pass')
        resp = self.client.put(url, {'title': 'Hacked'}, format='json')
        self.assertIn(resp.status_code, (401, 403))

    def test_owner_can_update_property(self):
        url = f'/api/v1/properties/{self.prop.id}/'
        self.client.login(username='agentuser', password='pass')
        resp = self.client.patch(url, {'title': 'Updated by owner'}, format='json')
        self.assertIn(resp.status_code, (200, 204))
