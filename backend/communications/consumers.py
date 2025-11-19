import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from communications.models import Conversation, Message, MessageNotification
from communications.serializers import MessageSerializer
from utils.encryption import get_encryption
from communications.notification_service import get_notification_service

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """Consumer for real-time notifications"""
    
    async def connect(self):
        user = self.scope["user"]
        
        if user.is_anonymous:
            await self.close()
            return

        # Add user to their personal notification group
        self.group_name = f"notifications_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Remove user from their notification group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def notification_message(self, event):
        """Send notification to WebSocket"""
        message = event["message"]
        await self.send(text_data=json.dumps(message))


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat with encryption and notifications"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Verify user is participant
        is_participant = await self.verify_participant()
        if not is_participant:
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Mark conversation as active
        await self.mark_conversation_active()
        
        logger.info(f"User {self.user.username} connected to conversation {self.conversation_id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.conversation_group_name,
            self.channel_name
        )
        logger.info(f"User {self.user.username} disconnected from conversation {self.conversation_id}")
    
    async def receive(self, text_data):
        """Handle incoming message"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')
            
            if message_type == 'message':
                await self.handle_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'read':
                await self.handle_read_receipt(data)
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send_error("Invalid message format")
        except Exception as e:
            logger.error(f"Error in receive: {e}")
            await self.send_error(str(e))
    
    async def handle_message(self, data):
        """Handle new message"""
        try:
            content = data.get('content', '').strip()
            if not content:
                return
            
            # Save message to database
            message = await self.save_message(content)
            
            # Serialize and broadcast
            serializer = MessageSerializer(message)
            message_data = serializer.data
            
            # Broadcast to group
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'chat.message',
                    'message': message_data,
                    'sender_id': self.user.id,
                }
            )
            
            # Send notifications to other participants
            await self.notify_participants(message)
            
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await self.send_error("Failed to send message")
    
    async def handle_typing(self, data):
        """Handle typing indicator"""
        is_typing = data.get('is_typing', False)
        
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing.indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing,
            }
        )
    
    async def handle_read_receipt(self, data):
        """Handle message read receipt"""
        message_id = data.get('message_id')
        if message_id:
            await self.mark_message_read(message_id)
    
    # Event handlers
    async def chat_message(self, event):
        """Send message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
        }))
    
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing'],
            }))
    
    async def notification(self, event):
        """Send notification to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'severity': event.get('severity', 'info'),
        }))
    
    # Database operations
    @database_sync_to_async
    def verify_participant(self):
        """Verify user is a participant in the conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.user in conversation.participants.all()
        except Conversation.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content):
        """Save message to database with encryption"""
        encryption = get_encryption()
        encrypted_content = encryption.encrypt_message(content)
        
        message = Message.objects.create(
            conversation_id=self.conversation_id,
            sender=self.user,
            content=encrypted_content,
            is_read=False,
        )
        return message
    
    @database_sync_to_async
    def mark_conversation_active(self):
        """Mark conversation as active"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            conversation.is_active = True
            conversation.save()
        except Conversation.DoesNotExist:
            logger.error(f"Conversation {self.conversation_id} not found")
    
    @database_sync_to_async
    def mark_message_read(self, message_id):
        """Mark message as read"""
        try:
            notification = MessageNotification.objects.get(
                message_id=message_id,
                user=self.user
            )
            notification.is_read = True
            notification.save()
            
            # Broadcast read receipt
            await self.broadcast_read_receipt(message_id)
        except MessageNotification.DoesNotExist:
            pass
    
    async def broadcast_read_receipt(self, message_id):
        """Broadcast read receipt to group"""
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'read.receipt',
                'message_id': message_id,
                'user_id': self.user.id,
            }
        )
    
    async def read_receipt(self, event):
        """Handle read receipt"""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'message_id': event['message_id'],
            'user_id': event['user_id'],
        }))
    
    @database_sync_to_async
    def get_conversation_participants(self):
        """Get other participants in conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return list(conversation.participants.exclude(id=self.user.id))
        except Conversation.DoesNotExist:
            return []
    
    async def notify_participants(self, message):
        """Send notifications to other participants"""
        try:
            participants = await self.get_conversation_participants()
            notification_service = get_notification_service()
            
            # Decrypt for notification
            encryption = get_encryption()
            decrypted_content = encryption.decrypt_message(message.content)
            
            for participant in participants:
                # Create notification record - wrap in async
                await self._create_notification(participant, message)
                
                # Send multi-channel notification
                notification_service.notify_new_message(
                    participant,
                    self.user.get_full_name() or self.user.username,
                    decrypted_content[:100],
                    channels=['push', 'email']
                )
        except Exception as e:
            logger.error(f"Error notifying participants: {e}")
    
    @database_sync_to_async
    def _create_notification(self, participant, message):
        """Create notification record"""
        MessageNotification.objects.create(
            user=participant,
            message=message,
            is_read=False,
        )
    
    async def send_error(self, error_message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message,
        }))



