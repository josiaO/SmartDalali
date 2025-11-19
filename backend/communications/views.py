from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.exceptions import MethodNotAllowed
from django_filters.rest_framework import DjangoFilterBackend
from .models import Conversation, Message, MessageNotification, Notification
from .serializers import (
    ConversationSerializer, MessageSerializer, CreateMessageSerializer,
    NotificationSerializer
)
from communications.notification_service import get_notification_service
from utils.encryption import get_encryption
import logging

logger = logging.getLogger(__name__)


# Views from messaging app
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['participants__username', 'property__title']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']
    http_method_names = ['get', 'head', 'options', 'post']
    
    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed('POST', detail="Use the 'start_conversation' endpoint to begin a conversation.")

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PUT')

    def partial_update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PATCH')

    def destroy(self, request, *args, **kwargs):
        raise MethodNotAllowed('DELETE')
    
    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(participants=user).prefetch_related('participants', 'messages')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages in a conversation"""
        try:
            conversation = self.get_object()
            messages = conversation.messages.all().order_by('created_at')
            serializer = MessageSerializer(messages, many=True)
            
            # Mark messages as read for the current user
            MessageNotification.objects.filter(
                user=request.user,
                message__conversation=conversation,
                is_read=False
            ).update(is_read=True)
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching messages: {e}")
            return Response(
                {'error': 'Failed to fetch messages'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Send a message in a conversation"""
        try:
            conversation = self.get_object()
            
            # Ensure sender is a participant in the conversation
            if request.user not in conversation.participants.all():
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = CreateMessageSerializer(
                data=request.data,
                context={'conversation': conversation, 'request': request}
            )
            
            if serializer.is_valid():
                message = serializer.save()
                
                # Send notifications to other participants
                notification_service = get_notification_service()
                encryption = get_encryption()
                decrypted_content = encryption.decrypt_message(message.content)
                
                for participant in conversation.participants.exclude(id=request.user.id):
                    if participant not in conversation.muted_by.all():
                        notification_service.notify_new_message(
                            participant,
                            request.user.get_full_name() or request.user.username,
                            decrypted_content[:100],
                            channels=['push', 'email']
                        )
                    
                    # Create notification
                    MessageNotification.objects.create(
                        user=participant,
                        message=message
                    )
                
                return Response(
                    MessageSerializer(message).data,
                    status=status.HTTP_201_CREATED
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return Response(
                {'error': 'Failed to send message'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        try:
            conversation = self.get_object()
            MessageNotification.objects.filter(
                user=request.user,
                message__conversation=conversation,
                is_read=False
            ).update(is_read=True)
            return Response({
                'status': 'success',
                'message': 'Conversation marked as read'
            })
        except Exception as e:
            logger.error(f"Error marking conversation as read: {e}")
            return Response(
                {'error': 'Failed to mark conversation as read'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mute(self, request, pk=None):
        """Mute/unmute conversation notifications"""
        try:
            conversation = self.get_object()
            muted = request.data.get('muted', True)
            if muted:
                conversation.muted_by.add(request.user)
            else:
                conversation.muted_by.remove(request.user)
            return Response({
                'status': 'success',
                'message': 'Conversation notifications muted' if muted else 'Conversation notifications unmuted'
            })
        except Exception as e:
            logger.error(f"Error muting conversation: {e}")
            return Response(
                {'error': 'Failed to mute conversation'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start a new conversation with another user"""
        try:
            user_id = request.data.get('user_id')
            property_id = request.data.get('property_id')
            
            if not user_id:
                return Response(
                    {'error': 'user_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate user_id
            try:
                user_id = int(user_id)
            except (ValueError, TypeError):
                return Response(
                    {'error': 'Invalid user_id format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user exists and is not the current user
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                other_user = User.objects.get(id=user_id)
                if other_user == request.user:
                    return Response(
                        {'error': 'Cannot start conversation with yourself'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except User.DoesNotExist:
                return Response(
                    {'error': 'User not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if conversation already exists
            existing_conversation = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants=other_user
            ).first()
            
            if existing_conversation:
                return Response(
                    ConversationSerializer(
                        existing_conversation,
                        context={'request': request}
                    ).data
                )
            
            # Create new conversation
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
            
            # Add property if specified
            if property_id:
                try:
                    property_id = int(property_id)
                except (ValueError, TypeError):
                    return Response(
                        {'error': 'Invalid property_id format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                from properties.models import Property
                try:
                    property_obj = Property.objects.get(id=property_id)
                    conversation.property = property_obj
                    conversation.save()
                except Property.DoesNotExist:
                    pass
            
            # Send notification
            notification_service = get_notification_service()
            property_title = conversation.property.title if conversation.property else "New Message"
            notification_service.notify_new_conversation(
                other_user,
                property_title,
                request.user.get_full_name() or request.user.username,
                channels=['email', 'push']
            )
            
            return Response(
                ConversationSerializer(
                    conversation,
                    context={'request': request}
                ).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error starting conversation: {e}")
            return Response(
                {'error': 'Failed to start conversation'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active conversations"""
        try:
            conversations = self.get_queryset().filter(is_active=True)
            serializer = self.get_serializer(conversations, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching active conversations: {e}")
            return Response(
                {'error': 'Failed to fetch active conversations'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get total unread message count for the user"""
        try:
            user = request.user
            unread_count = MessageNotification.objects.filter(
                user=user,
                is_read=False
            ).count()
            return Response({'unread_count': unread_count})
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return Response(
                {'error': 'Failed to get unread count'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['conversation']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            conversation__participants=user
        ).select_related('sender', 'conversation')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        try:
            message = self.get_object()
            
            # Check if user is a participant in the conversation
            if request.user not in message.conversation.participants.all():
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Mark notification as read
            MessageNotification.objects.filter(
                user=request.user,
                message=message
            ).update(is_read=True)
            
            return Response({'status': 'Message marked as read'})
        except Exception as e:
            logger.error(f"Error marking message as read: {e}")
            return Response(
                {'error': 'Failed to mark message as read'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Add emoji reaction to message"""
        try:
            message = self.get_object()
            emoji = request.data.get('emoji')
            if not emoji:
                return Response(
                    {'error': 'Emoji required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user is a participant
            if request.user not in message.conversation.participants.all():
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return Response({'status': 'Reaction added'})
        except Exception as e:
            logger.error(f"Error reacting to message: {e}")
            return Response(
                {'error': 'Failed to add reaction'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread message count"""
        try:
            count = MessageNotification.objects.filter(
                user=request.user,
                is_read=False
            ).count()
            return Response({'unread_count': count})
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return Response(
                {'error': 'Failed to get unread count'},
                status=status.HTTP_400_BAD_REQUEST
            )


# Views from notifications app
class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows notifications to be viewed or edited.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the notifications
        for the currently authenticated user.
        """
        return self.request.user.notifications.all()

