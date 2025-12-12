import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.db.models import Q
from communications.models import Conversation, Message, MessageNotification
from communications.serializers import MessageSerializer
from communications.notification_service import get_notification_service
from communications.throttles import WebSocketRateLimit
from rest_framework.exceptions import Throttled

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
        
        # Set User Online
        await self.set_user_status(user, True)

    async def disconnect(self, close_code):
        user = self.scope["user"]
        # Remove user from their notification group
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        
        # Set User Offline
        if not user.is_anonymous:
            await self.set_user_status(user, False)

    async def notification_message(self, event):
        """Send notification to WebSocket"""
        message = event["message"]
        await self.send(text_data=json.dumps(message))
    
    @database_sync_to_async
    def set_user_status(self, user, is_online):
        try:
            profile = user.profile
            profile.is_online = is_online
            profile.save()
            
            # Broadcast to active conversations (Simplified logic)
            # Find conversations where this user is a participant
            conversations = Conversation.objects.filter(
                Q(user=user) | Q(agent=user),
                is_active=True
            )
            
            channel_layer = get_channel_layer()
            for conv in conversations:
                async_to_sync(channel_layer.group_send)(
                    f'chat_{conv.id}',
                    {
                        'type': 'user_status',
                        'user_id': user.id,
                        'is_online': is_online
                    }
                )
        except Exception as e:
            logger.error(f"Error setting user status: {e}")


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time chat"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.rate_limiter = WebSocketRateLimit(max_messages=10, window=10)
    
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
        
        # Send initial status of other participant
        status_data = await self.get_initial_status()
        if status_data:
            await self.send(text_data=json.dumps({
                'type': 'user_status',
                'user_id': status_data['user_id'],
                'is_online': status_data['is_online']
            }))
        
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
        """Handle new message with rate limiting"""
        try:
            # Check rate limit first
            await self.check_rate_limit()
            
            text = data.get('text', '').strip()
            # If front-end sends 'content', support that too for compatibility
            if not text:
                 text = data.get('content', '').strip()

            if not text:
                return
            
            # Save message to database
            message = await self.save_message(text)
            
            # Serialize and broadcast
            # We need to manually serialize simple data to avoid sync calls in serializer if possible, 
            # or wrap serializer in sync_to_async.
            message_data = await self.serialize_message(message)
            
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
            
        except Throttled as e:
            logger.warning(f"Rate limit exceeded for user {self.user.id} in conversation {self.conversation_id}")
            await self.send_error(f"Rate limit exceeded. Please wait {int(e.wait)} seconds.")
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)
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
            success = await self.mark_message_read(message_id)
            if success:
                await self.broadcast_read_receipt(message_id)
    
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

    async def user_status(self, event):
        """Send user status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'is_online': event['is_online']
        }))
    
    # Database operations
    @database_sync_to_async
    def verify_participant(self):
        """Verify user is a participant in the conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return self.user == conversation.user or self.user == conversation.agent
        except Conversation.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, text):
        """Save message to database"""
        message = Message.objects.create(
            conversation_id=self.conversation_id,
            sender=self.user,
            text=text,
        )
        return message

    @database_sync_to_async
    def serialize_message(self, message):
         return MessageSerializer(message).data
    
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
            # We are marking a message as read by THIS user.
            # So updating notification OR setting read_at if not set?
            # Model has read_at on message (single time?) or MessageNotification per user.
            # strict Message model has read_at.
            # I should update read_at if I am the recipient.
            
            message = Message.objects.get(id=message_id)
            if message.sender != self.user and not message.read_at:
                from django.utils import timezone
                message.read_at = timezone.now()
                message.read_at = timezone.now()
                message.save()
                
            notification = MessageNotification.objects.filter(
                message_id=message_id,
                user=self.user
            ).first()
            
            if notification:
                notification.is_read = True
                notification.save()
                return True
            return False
        except Message.DoesNotExist:
            return False
    
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
    def get_other_participant(self):
        """Get other participant in conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.agent if conversation.user == self.user else conversation.user
        except Conversation.DoesNotExist:
            return None
    
    async def notify_participants(self, message):
        """Send notifications to other participants"""
        try:
            other_participant = await self.get_other_participant()
            if not other_participant:
                return

            notification_service = get_notification_service()
            
            # Create notification record - wrap in async
            await self._create_notification(other_participant, message)
            
            # Send multi-channel notification
            if notification_service:
                from asgiref.sync import sync_to_async
                content_preview = message.text[:100] if message.text else "Attachment"
                await sync_to_async(notification_service.notify_new_message)(
                    other_participant,
                    self.user.get_full_name() or self.user.username,
                    content_preview,
                    channels=['push', 'email'],
                    conversation_id=self.conversation_id
                )
        except Exception as e:
            logger.error(f"Error notifying participants: {e}")
    
    @database_sync_to_async
    def get_initial_status(self):
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            other = conversation.agent if conversation.user == self.user else conversation.user
            
            # Check profile status
            is_online = False
            if hasattr(other, 'profile'):
                is_online = other.profile.is_online
                
            # Send to self (sync wrapper needed if calling async send from sync context? No, this is async method called from async)
            # But wait, send_initial_status is decorated with database_sync_to_async, so it runs in thread.
            # I cannot call await self.send() from inside it easily without async_to_sync which is messy.
            # Better: make it return status, then send in connect.
            return {
                'user_id': other.id,
                'is_online': is_online
            }
        except Exception:
            return None

    @database_sync_to_async
    def _create_notification(self, participant, message):
        """Create notification record"""
        MessageNotification.objects.create(
            user=participant,
            message=message,
            is_read=False,
        )
    
    @database_sync_to_async
    def check_rate_limit(self):
        """Check WebSocket rate limit"""
        return self.rate_limiter.allow_message(self.user.id, self.conversation_id)
    
    async def send_error(self, error_message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message,
        }))



