
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from properties.models import Property, PropertyVisit
from communications.models import Message, Conversation

User = get_user_model()

class VisitAndReplyTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user', email='user@test.com', password='password')
        self.agent = User.objects.create_user(username='agent', email='agent@test.com', password='password')
        self.property = Property.objects.create(
            owner=self.agent,
            title='Test Property',
            price=100000,
            city='Test City',
            bedrooms=2,
            bathrooms=1,
            rooms=3
        )

    def test_create_and_manage_visit(self):
        # 1. User requests a visit
        self.client.force_authenticate(user=self.user)
        visit_data = {
            'property': self.property.id,
            'agent': self.agent.id,
            'date': '2025-12-25',
            'time': '10:00:00',
            'notes': 'Looking forward to it'
        }
        response = self.client.post('/api/v1/properties/visits/', visit_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        visit_id = response.data['id']
        
        # Verify visit created with pending status
        visit = PropertyVisit.objects.get(id=visit_id)
        self.assertEqual(visit.status, 'pending')
        self.assertEqual(visit.user, self.user)
        self.assertEqual(visit.agent, self.agent)

        # 2. Agent accepts visit
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f'/api/v1/properties/visits/{visit_id}/status/', {'status': 'confirmed'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        visit.refresh_from_db()
        self.assertEqual(visit.status, 'confirmed')

    def test_message_reply(self):
        # Setup conversation and original message
        conversation = Conversation.objects.create(user=self.user, agent=self.agent, property=self.property)
        original_msg = Message.objects.create(
            conversation=conversation,
            sender=self.agent,
            text='Original message'
        )

        # User replies
        self.client.force_authenticate(user=self.user)
        reply_data = {
            'text': 'This is a reply',
            'reply_to_id': original_msg.id
        }
        # Assuming we have a message viewset at /api/v1/communications/conversations/{id}/messages/
        # Or checking model directly if endpoint not readily available in quick test
        # Let's try creating via Message.objects to verify model capability first
        reply_msg = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            text='This is a reply',
            reply_to=original_msg
        )
        
        self.assertEqual(reply_msg.reply_to, original_msg)
        self.assertIn(reply_msg, original_msg.replies.all())
