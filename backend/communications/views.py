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
from .throttles import MessageRateThrottle, ConversationRateThrottle
import logging
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


# Views from messaging app
class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'agent__username', 'property__title']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']
    pagination_class = None
    http_method_names = ['get', 'head', 'options', 'post']
    
    def get_throttles(self):
        """Apply specific throttles based on action"""
        if self.action == 'send_message':
            return [MessageRateThrottle()]
        elif self.action == 'start_conversation':
            return [ConversationRateThrottle()]
        return super().get_throttles()
    
    def create(self, request, *args, **kwargs):
        raise MethodNotAllowed('POST', detail="Use the 'start_conversation' endpoint to begin a conversation.")

    def update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PUT')

    def partial_update(self, request, *args, **kwargs):
        raise MethodNotAllowed('PATCH')


    
    def get_queryset(self):
        user = self.request.user
        queryset = Conversation.objects.filter(
            Q(user=user) | Q(agent=user)
        ).select_related('user', 'agent', 'property').prefetch_related('messages')
        
        if self.action == 'list':
            # DEBUG-LOG
            print(f"DEBUG: Filtering list for user {user.id}. Total before: {queryset.count()}")
            queryset = queryset.exclude(hidden_by=user)
            print(f"DEBUG: Total after hidden_by exclude: {queryset.count()}")
            
        return queryset
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def _is_participant(self, user, conversation):
        return user == conversation.user or user == conversation.agent
    
    def _get_other_participant(self, user, conversation):
        return conversation.agent if conversation.user == user else conversation.user

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get messages in a conversation"""
        try:
            conversation = self.get_object()
            if not self._is_participant(request.user, conversation):
                 return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            messages = conversation.messages.all().order_by('created_at')
            serializer = MessageSerializer(messages, many=True)
            
            # Mark messages as read for the current user (messages sent by OTHER party)
            conversation.messages.filter(
                read_at__isnull=True
            ).exclude(sender=request.user).update(read_at=timezone.now())
            
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
            if not self._is_participant(request.user, conversation):
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
                
                # Unhide conversation for the receiver when new message arrives
                # This ensures conversations reappear when you get a new message
                other_participant = self._get_other_participant(request.user, conversation)
                conversation.hidden_by.remove(other_participant)
                
                # Send notifications to other participant
                notification_service = get_notification_service()
                
                other_participant = self._get_other_participant(request.user, conversation)
                
                # We removed encryption for now based on strict model requirements
                content_preview = message.text[:100] if message.text else "Attachment"

                if notification_service:
                    notification_service.notify_new_message(
                        other_participant,
                        request.user.get_full_name() or request.user.username,
                        content_preview,
                        conversation_id=conversation.id,
                        channels=['push', 'email']
                    )
                    
                # Create notification
                MessageNotification.objects.create(
                    user=other_participant,
                    message=message
                )

                # Broadcast to WebSocket group
                # This ensures real-time updates for clients connected via WebSocket
                try:
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f'chat_{conversation.id}',
                        {
                            'type': 'chat.message',
                            'message': MessageSerializer(message).data,
                            'sender_id': request.user.id,
                        }
                    )
                except Exception as ws_error:
                    logger.error(f"WebSocket broadcast failed: {ws_error}")
                
                return Response(
                    MessageSerializer(message).data,
                    status=status.HTTP_201_CREATED
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error sending message: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to send message'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        try:
            conversation = self.get_object()
            conversation.messages.filter(
                read_at__isnull=True
            ).exclude(sender=request.user).update(read_at=timezone.now())
            
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
    
    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        """Start a new conversation with another user"""
        try:
            # For phase 1: 'user_id' in body is the AGENT (or target user).
            # The requester is the CLIENT (or initiator).
            # However, looking at the requirements, 'user visits property page'.
            # Requester = User. Target = Agent.
            
            agent_id = request.data.get('agent_id') or request.data.get('user_id') # Handle both for compatibility or mistakes
            property_id = request.data.get('property_id')
            
            if not agent_id:
                return Response(
                    {'error': 'agent_id (or user_id) is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate IDs
            try:
                agent_id = int(agent_id)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid ID format'}, status=status.HTTP_400_BAD_REQUEST)

             # Check for self-chat
            if agent_id == request.user.id:
                 return Response({'error': 'Cannot start conversation with yourself'}, status=status.HTTP_400_BAD_REQUEST)
            
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                agent_user = User.objects.get(id=agent_id)
            except User.DoesNotExist:
                return Response({'error': 'Agent/User not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Determine who is user and who is agent? 
            # The model has 'user' and 'agent'.
            # Requirement: "user sends message to agent".
            # Assume requester is 'user', target is 'agent'.
            # But what if agent contacts user?
            # Ideally verify roles. For now, strict adherence to flow: User visits property -> contacts agent.
            # So requester = user, target = agent.
            
            # Check if exists
            # We need to check if a conversation exists between these two people on this property.
            # Or just between these two people?
            # Requirement: "If no conversation exists for this property + user + agent → create a new one."
            
            # So unique tuple is (user, agent, property).
            
            property_obj = None
            if property_id:
                from properties.models import Property
                try:
                    property_obj = Property.objects.get(id=property_id)
                except Property.DoesNotExist:
                    pass

            # Check for existing NON-HIDDEN conversation
            # We allow multiple conversations, but only use the latest non-hidden one
            conversation = Conversation.objects.filter(
                user=request.user,
                agent=agent_user,
                property=property_obj
            ).exclude(hidden_by=request.user).order_by('-created_at').first()

            if not conversation:
                # Create a new conversation
                # This happens when: no conversation exists OR all conversations are hidden
                conversation = Conversation.objects.create(
                    user=request.user,
                    agent=agent_user,
                    property=property_obj
                )
                logger.info(f"Created new conversation {conversation.id} for user {request.user.id} and agent {agent_user.id}")
                
                # Send notification for NEW conversation
                notification_service = get_notification_service()
                if notification_service:
                    property_title = conversation.property.title if conversation.property else "New Inquiry"
                    notification_service.notify_new_conversation(
                        agent_user,
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
            logger.error(f"Error starting conversation: {e}", exc_info=True)
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
            # Count messages where user is a participant but NOT sender, and read_at is Null
            # This requires joining Conversation.
            # OR simple approach:
            
            count = Message.objects.filter(
                Q(conversation__user=user) | Q(conversation__agent=user),
                read_at__isnull=True
            ).exclude(sender=user).count()
            
            
            return Response({'unread_count': count})
        except Exception as e:
            logger.error(f"Error getting unread count: {e}")
            return Response(
                {'error': 'Failed to get unread count'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=True, methods=['post'])
    def clear_history(self, request, pk=None):
        """Clear conversation history for the current user"""
        try:
            conversation = self.get_object()
            if not self._is_participant(request.user, conversation):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Get all messages visible to user (not yet hidden)
            # We want to add user to hidden_by of ALL messages in conversation
            # Using bulk create for M2M is tricky because it's a through table implicit model usually, 
            # but standard .add() on queryset is not supported directly for many-to-many reverse
            
            # Efficient way: 
            # messages = conversation.messages.exclude(hidden_by=request.user)
            # for msg in messages: msg.hidden_by.add(request.user) -> Slow loop
            
            # Correct Bulk way:
            messages = conversation.messages.exclude(hidden_by=request.user)
            
            # We can use the through model directly
            MessageHiddenBy = Message.hidden_by.through
            new_relations = []
            for msg in messages:
                new_relations.append(MessageHiddenBy(message_id=msg.id, user_id=request.user.id))
            
            MessageHiddenBy.objects.bulk_create(new_relations, ignore_conflicts=True)
            
            # 2. Hide the conversation itself from the list
            conversation.hidden_by.add(request.user)
            # DEBUG-LOG
            print(f"DEBUG: Added user {request.user.id} to hidden_by of conversation {conversation.id}")
            print(f"DEBUG: hidden_by users: {list(conversation.hidden_by.values_list('id', flat=True))}")
            
            return Response({'status': 'Conversation history cleared and hidden'})
        except Exception as e:
            logger.error(f"Error clearing history: {e}")
            return Response(
                {'error': 'Failed to clear history'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['conversation']
    ordering_fields = ['created_at']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    pagination_class = None
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Message.objects.none()
        return Message.objects.filter(
            Q(conversation__user=user) | Q(conversation__agent=user)
        ).exclude(hidden_by=user).select_related('sender', 'conversation')

    def create(self, request, *args, **kwargs):
        """Create a new message"""
        try:
            conversation_id = request.data.get('conversation')
            if not conversation_id:
                return Response({'error': 'conversation field is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                conversation = Conversation.objects.get(id=conversation_id)
            except Conversation.DoesNotExist:
                return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

            # Check permissions
            if request.user != conversation.user and request.user != conversation.agent:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            serializer = CreateMessageSerializer(
                data=request.data,
                context={'conversation': conversation, 'request': request}
            )

            if serializer.is_valid():
                message = serializer.save()
                
                # Unhide conversation for both participants
                conversation.hidden_by.clear()

                # Send external notifications (Email/Push)
                # Note: DB notifications are handled by custom logic in views/serializers usually,
                # but CreateMessageSerializer puts basic MessageNotification.
                
                notification_service = get_notification_service()
                
                other_participant = conversation.agent if conversation.user == request.user else conversation.user
                
                content_preview = message.text[:100] if message.text else "Attachment"
                
                if notification_service:
                    notification_service.notify_new_message(
                        other_participant,
                        request.user.get_full_name() or request.user.username,
                        content_preview,
                        channels=['push', 'email']
                    )

                # Broadcast to WebSocket group
                try:
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f'chat_{conversation.id}',
                        {
                            'type': 'chat.message',
                            'message': MessageSerializer(message).data,
                            'sender_id': request.user.id,
                        }
                    )
                except Exception as ws_error:
                    logger.error(f"WebSocket broadcast failed: {ws_error}")

                return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating message: {e}")
            return Response({'error': 'Failed to create message'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'])
    def delete_for_everyone(self, request, pk=None):
        """Delete a message for everyone (within time window)"""
        try:
            message = self.get_object()
            
            # Only sender can delete
            if message.sender != request.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            # Check time window (e.g., 1 hour)
            time_diff = timezone.now() - message.created_at
            if time_diff.total_seconds() > 3600:
                return Response({'error': 'Message too old to delete for everyone'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Soft delete globally
            message.is_deleted = True
            message.text = "This message was deleted" # Optional: update DB text too, but serializer handles it.
            # We should probably clear connection to file to save space or just keep it?
            # Req: "Remove attachments"
            message.attachment = None
            message.deleted_at = timezone.now()
            message.save()
            
            # Broadcast deletion
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'chat_{message.conversation.id}',
                    {
                        'type': 'chat.message',
                        'message': MessageSerializer(message).data,
                        'sender_id': request.user.id,
                    }
                )
            except Exception as e:
                logger.error(f"Error broadcasting deletion: {e}")
                
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
             logger.error(f"Error deleting message: {e}")
             return Response({'error': 'Failed to delete message'}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        return self.delete_for_everyone(request, *args, **kwargs)
    
    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(conversation__user=user) | Q(conversation__agent=user)
        ).exclude(hidden_by=user).select_related('sender', 'conversation')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        try:
            message = self.get_object()
            
            is_participant = (request.user == message.conversation.user) or (request.user == message.conversation.agent)
            
            if not is_participant:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not message.read_at:
                message.read_at = timezone.now()
                message.save()
            
            return Response({'status': 'Message marked as read'})
        except Exception as e:
            logger.error(f"Error marking message as read: {e}")
            return Response(
                {'error': 'Failed to mark message as read'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['delete'])
    def delete_for_me(self, request, pk=None):
        """Hidden a message for the current user only"""
        try:
            message = self.get_object()
            
            # Check if participant
            is_participant = (request.user == message.conversation.user) or (request.user == message.conversation.agent)
            if not is_participant:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
            message.hidden_by.add(request.user)
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting message for me: {e}")
            return Response({'error': 'Failed to delete message'}, status=status.HTTP_400_BAD_REQUEST)


# Views from notifications app
class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows notifications to be viewed or edited.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        This view should return a list of all the notifications
        for the currently authenticated user.
        """
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read"""
        try:
            notification = self.get_object()
            notification.is_read = True
            notification.save()
            return Response({'status': 'Notification marked as read'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def clear_history(self, request, pk=None):
        """Clear conversation history for the current user (Hide)"""
        try:
            conversation = self.get_object()
            
            # Hide the conversation
            conversation.hidden_by.add(request.user)
            
            # Also hide all CURRENT messages for this user
            # This ensures they don't see them if they re-open the chat
            conversation.messages.all().update() # Trick to get queryset, then loop?
            # Better: bulk add to m2m is hard in Django without through model or loop.
            # But we can just use the fact that Conversation is hidden.
            # However, if they get a NEW message, conversation unhides (we did that in send_message).
            # But OLD messages should remain hidden?
            # The requirement: "Remove all chats -> remove user from message list"
            # "If both sides hide -> conversation hidden but messages stay key".
            # "Delete For Me" on conversation should wipe history.
            
            # So we should add user to hidden_by of ALl existing messages?
            # That operation might be heavy for long chats.
            # But necessary if we want "clear history" behavior.
            messages = conversation.messages.all()
            for msg in messages:
                msg.hidden_by.add(request.user)
                
            return Response({'status': 'Conversation history cleared'})
        except Exception as e:
            logger.error(f"Error clearing history: {e}")
            return Response({'error': 'Failed to clear history'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user"""
        try:
            self.get_queryset().filter(is_read=False).update(is_read=True)
            return Response({'status': 'All notifications marked as read'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


