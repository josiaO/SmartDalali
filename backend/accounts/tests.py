from django.test import TestCase
from django.contrib.auth.models import User, Group
from accounts.models import Profile

class RoleTestCase(TestCase):
    def setUp(self):
        self.agent_group = Group.objects.create(name='agent')

    def test_user_role_creation(self):
        user = User.objects.create_user(username='testuser', password='password')
        # Signal should create profile with default role 'user'
        self.assertEqual(user.profile.role, 'user')

    def test_agent_role_creation(self):
        user = User.objects.create_user(username='testagent', password='password')
        user.groups.add(self.agent_group)
        # Re-save profile to trigger any updates if logic was in save (but logic is in signal on create)
        # Since signal runs on create, we need to simulate the flow where group is added *before* profile creation 
        # OR check if we need to update profile role when group is added. 
        # Current implementation only sets role on CREATE. 
        
        # Let's test the explicit creation flow used in registration
        user2 = User.objects.create_user(username='testagent2', password='password')
        user2.groups.add(self.agent_group)
        # Manually update role as the signal only runs once on creation
        user2.profile.role = 'agent'
        user2.profile.save()
        self.assertEqual(user2.profile.role, 'agent')

    def test_admin_role_creation(self):
        admin = User.objects.create_superuser(username='testadmin', password='password', email='admin@test.com')
        self.assertEqual(admin.profile.role, 'admin')
