"""
WebSocket consumer tests for real-time communications
"""
import json
from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import User
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from communications.models import Conversation, Message, MessageNotification
from communications.consumers import ChatConsumer, NotificationConsumer
from properties.models import AgentProfile
from backend.asgi import application


class ChatConsumerTests(TransactionTestCase):
    """Test ChatConsumer WebSocket functionality"""
    
    async def async_setup(self):
        """Async setup for test"""
        self.user1 = await database_sync_to_async(User.objects.create_user)(
            username='user1', 
            email='user1@test.com', 
            password='testpass123'
        )
        self.user2 = await database_sync_to_async(User.objects.create_user)(
            username='user2', 
            email='user2@test.com', 
            password='testpass123'
        )
        self.conversation = await database_sync_to_async(Conversation.objects.create)()
        await database_sync_to_async(self.conversation.participants.add)(self.user1, self.user2)
        return self.user1, self.user2, self.conversation
    
    def setUp(self):
        """Set up test fixtures"""
        import asyncio
        self.user1, self.user2, self.conversation = asyncio.run(self.async_setup())
    
    async def test_chat_consumer_connect(self):
        """Test WebSocket connection to chat"""
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(),
            f"/ws/chat/{self.conversation.id}/",
        )
        communicator.scope["user"] = self.user1
        communicator.scope['url_route'] = {'kwargs': {'conversation_id': str(self.conversation.id)}}
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()
    
    async def test_chat_consumer_send_message(self):
        """Test sending a message through WebSocket"""
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(),
            f"/ws/chat/{self.conversation.id}/",
        )
        communicator.scope["user"] = self.user1
        communicator.scope['url_route'] = {'kwargs': {'conversation_id': str(self.conversation.id)}}
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Send message
        await communicator.send_json_to({
            'type': 'message',
            'content': 'Test message'
        })
        
        # Receive broadcast message
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'message')
        self.assertIn('message', response)
        self.assertEqual(response['message']['content'], 'Test message')
        
        await communicator.disconnect()
    
    async def test_chat_consumer_typing_indicator(self):
        """Test typing indicator through WebSocket"""
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(),
            f"/ws/chat/{self.conversation.id}/",
        )
        communicator.scope["user"] = self.user1
        communicator.scope['url_route'] = {'kwargs': {'conversation_id': str(self.conversation.id)}}
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Send typing indicator
        await communicator.send_json_to({
            'type': 'typing',
            'is_typing': True
        })
        
        # Receive typing indicator
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'typing')
        self.assertTrue(response['is_typing'])
        
        await communicator.disconnect()
    
    async def test_chat_consumer_unauthorized_access(self):
        """Test that non-participants cannot connect"""
        other_user = await database_sync_to_async(User.objects.create_user)(
            username='other_user',
            email='other@test.com',
            password='testpass123'
        )
        
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(),
            f"/ws/chat/{self.conversation.id}/",
        )
        communicator.scope["user"] = other_user
        communicator.scope['url_route'] = {'kwargs': {'conversation_id': str(self.conversation.id)}}
        
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
    
    async def test_chat_consumer_anonymous_user(self):
        """Test that anonymous users cannot connect"""
        from django.contrib.auth.models import AnonymousUser
        
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(),
            f"/ws/chat/{self.conversation.id}/",
        )
        communicator.scope["user"] = AnonymousUser()
        communicator.scope['url_route'] = {'kwargs': {'conversation_id': str(self.conversation.id)}}
        
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
    
    async def test_message_encryption(self):
        """Test that messages are encrypted"""
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(),
            f"/ws/chat/{self.conversation.id}/",
        )
        communicator.scope["user"] = self.user1
        communicator.scope['url_route'] = {'kwargs': {'conversation_id': str(self.conversation.id)}}
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Send message
        test_content = 'Secret message'
        await communicator.send_json_to({
            'type': 'message',
            'content': test_content
        })
        
        # Receive broadcast
        response = await communicator.receive_json_from()
        
        # Verify message is stored (encrypted)
        message = await database_sync_to_async(lambda: Message.objects.latest('id'))()
        # The encrypted content should be different from original
        self.assertNotEqual(message.content, test_content)
        
        await communicator.disconnect()
    
    async def test_read_receipt(self):
        """Test read receipt functionality"""
        # Create a message first
        message = await database_sync_to_async(Message.objects.create)(
            conversation=self.conversation,
            sender=self.user1,
            content='Test message'
        )
        
        communicator = WebsocketCommunicator(
            ChatConsumer.as_asgi(),
            f"/ws/chat/{self.conversation.id}/",
        )
        communicator.scope["user"] = self.user2
        communicator.scope['url_route'] = {'kwargs': {'conversation_id': str(self.conversation.id)}}
        
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        
        # Send read receipt
        await communicator.send_json_to({
            'type': 'read',
            'message_id': message.id
        })
        
        # Verify notification was marked as read
        notification = await database_sync_to_async(
            lambda: MessageNotification.objects.get(
                message=message,
                user=self.user2
            )
        )()
        self.assertTrue(notification.is_read)
        
        await communicator.disconnect()


class NotificationConsumerTests(TransactionTestCase):
    """Test NotificationConsumer WebSocket functionality"""
    
    async def async_setup(self):
        """Async setup for test"""
        self.user = await database_sync_to_async(User.objects.create_user)(
            username='user1',
            email='user1@test.com',
            password='testpass123'
        )
        return self.user
    
    def setUp(self):
        """Set up test fixtures"""
        import asyncio
        self.user = asyncio.run(self.async_setup())
    
    async def test_notification_consumer_connect(self):
        """Test WebSocket connection to notifications"""
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            "/ws/notifications/",
        )
        communicator.scope["user"] = self.user
        
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        
        await communicator.disconnect()
    
    async def test_notification_consumer_anonymous_user(self):
        """Test that anonymous users cannot connect to notifications"""
        from django.contrib.auth.models import AnonymousUser
        
        communicator = WebsocketCommunicator(
            NotificationConsumer.as_asgi(),
            "/ws/notifications/",
        )
        communicator.scope["user"] = AnonymousUser()
        
        connected, subprotocol = await communicator.connect()
        self.assertFalse(connected)


class WebSocketIntegrationTests(TestCase):
    """Integration tests for WebSocket with REST API"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123'
        )
        self.conversation = Conversation.objects.create()
        self.conversation.participants.add(self.user1, self.user2)
    
    def test_message_creates_notification(self):
        """Test that creating a message creates notifications"""
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.user1,
            content='Test message'
        )
        
        # Verify notification was created for other user
        self.assertTrue(
            MessageNotification.objects.filter(
                message=message,
                user=self.user2
            ).exists()
        )
    
    def test_message_encryption_key_generation(self):
        """Test that encryption keys are properly generated"""
        from utils.encryption import get_encryption
        
        encryption = get_encryption()
        
        test_message = 'Secret test message'
        encrypted = encryption.encrypt_message(test_message)
        
        # Encrypted message should be different
        self.assertNotEqual(encrypted, test_message)
        
        # Should be able to decrypt
        decrypted = encryption.decrypt_message(encrypted)
        self.assertEqual(decrypted, test_message)
