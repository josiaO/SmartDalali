from django.test import TestCase
from django.contrib.auth.models import User
from .models import Conversation, Message, MessageNotification, Notification


class CommunicationsTests(TestCase):
    def setUp(self):
        self.u1 = User.objects.create_user(username='user1', email='user1@test.com', password='testpass123')
        self.u2 = User.objects.create_user(username='user2', email='user2@test.com', password='testpass123')
    
    def test_conversation_creation(self):
        conv = Conversation.objects.create()
        conv.participants.add(self.u1, self.u2)
        self.assertEqual(conv.participants.count(), 2)
    
    def test_message_creation(self):
        conv = Conversation.objects.create()
        conv.participants.add(self.u1, self.u2)
        msg = Message.objects.create(conversation=conv, sender=self.u1, content='Test message')
        self.assertEqual(msg.content, 'Test message')
        self.assertTrue(MessageNotification.objects.filter(user=self.u2, message=msg).exists())
    
    def test_notification_creation(self):
        notif = Notification.objects.create(
            user=self.u1,
            type='test',
            title='Test Notification',
            message='This is a test'
        )
        self.assertEqual(notif.title, 'Test Notification')
        self.assertFalse(notif.read)


