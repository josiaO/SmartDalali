from rest_framework import serializers
from .models import (
    Conversation, Message, MessageNotification, Notification,
    MessageAttachment, MessageThread, ConversationAnalysis,
    ConversationTag, ConversationTagging, MessageReaction
)
from accounts.models import Profile
from accounts.roles import get_user_role



# Serializers from messaging app
class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'sender_role', 'sender_avatar', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'is_read', 'created_at']
    
    def get_sender_role(self, obj):
        return get_user_role(obj.sender)
    
    def get_sender_avatar(self, obj):
        try:
            profile = obj.sender.profile
            if profile and profile.image:
                return profile.image.url
        except:
            pass
        return None


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    property_title = serializers.CharField(source='property.title', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'property', 'property_title',
            'last_message', 'unread_count', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['participants', 'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    'id': other_user.id,
                    'username': other_user.username,
                    'email': other_user.email,
                    'role': get_user_role(other_user),
                    'avatar': other_user.profile.image.url if hasattr(other_user, 'profile') and other_user.profile.image else None
                }
        return None
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content,
                'sender_id': last_msg.sender.id,
                'sender_name': last_msg.sender.username,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(sender__in=obj.participants.exclude(id=request.user.id), is_read=False).count()
        return 0


class CreateMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content']
    
    def create(self, validated_data):
        conversation = self.context['conversation']
        sender = self.context['request'].user
        
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=validated_data['content']
        )
        
        # Create notifications for other participants
        for participant in conversation.participants.exclude(id=sender.id):
            MessageNotification.objects.create(
                user=participant,
                message=message
            )
        
        # Update conversation timestamp
        conversation.save()
        
        return message


# Serializers from notifications app
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'read', 'created_at', 'data']
        read_only_fields = ['id', 'user', 'created_at']


# Enhanced serializers for Phase 1 features
class MessageAttachmentSerializer(serializers.ModelSerializer):
    file_size_display = serializers.CharField(source='get_file_size_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageAttachment
        fields = [
            'id', 'message', 'file', 'file_url', 'file_type', 'file_name', 
            'file_size', 'file_size_display', 'mime_type', 'uploaded_at'
        ]
        read_only_fields = ['id', 'file_size', 'mime_type', 'uploaded_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class MessageThreadSerializer(serializers.ModelSerializer):
    parent_content = serializers.CharField(source='parent_message.content', read_only=True)
    parent_sender = serializers.CharField(source='parent_message.sender.username', read_only=True)
    reply_content = serializers.CharField(source='reply_message.content', read_only=True)
    reply_sender = serializers.CharField(source='reply_message.sender.username', read_only=True)
    
    class Meta:
        model = MessageThread
        fields = [
            'id', 'parent_message', 'parent_content', 'parent_sender',
            'reply_message', 'reply_content', 'reply_sender', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ConversationAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationAnalysis
        fields = [
            'id', 'conversation', 'sentiment', 'sentiment_score', 'intent',
            'priority', 'suggested_response', 'key_topics', 'action_items',
            'analyzed_at'
        ]
        read_only_fields = ['id', 'analyzed_at']


class ConversationTagSerializer(serializers.ModelSerializer):
    conversation_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ConversationTag
        fields = ['id', 'name', 'color', 'description', 'conversation_count', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_conversation_count(self, obj):
        return obj.conversations.count()


class MessageReactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = MessageReaction
        fields = ['id', 'message', 'user', 'username', 'emoji', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


# Enhanced existing serializers
class EnhancedMessageSerializer(serializers.ModelSerializer):
    """Enhanced message serializer with attachments, threads, and reactions"""
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    reaction_summary = serializers.SerializerMethodField()
    thread_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'sender_name', 'sender_role', 'sender_avatar',
            'content', 'is_read', 'created_at', 'attachments', 'reactions',
            'reaction_summary', 'thread_info'
        ]
        read_only_fields = ['sender', 'is_read', 'created_at']
    
    def get_sender_role(self, obj):
        return get_user_role(obj.sender)
    
    def get_sender_avatar(self, obj):
        try:
            profile = obj.sender.profile
            if profile and profile.image:
                return profile.image.url
        except:
            pass
        return None
    
    def get_reaction_summary(self, obj):
        """Group reactions by emoji with counts"""
        from django.db.models import Count
        reactions = obj.reactions.values('emoji').annotate(count=Count('emoji'))
        return {r['emoji']: r['count'] for r in reactions}
    
    def get_thread_info(self, obj):
        """Get thread information if this message is part of a thread"""
        try:
            # Check if this is a reply
            if hasattr(obj, 'thread_parent') and obj.thread_parent:
                return {
                    'is_reply': True,
                    'parent_id': obj.thread_parent.parent_message.id,
                    'parent_preview': obj.thread_parent.parent_message.content[:50]
                }
            # Check if this has replies
            reply_count = obj.thread_children.count()
            if reply_count > 0:
                return {
                    'is_reply': False,
                    'has_replies': True,
                    'reply_count': reply_count
                }
        except:
            pass
        return None


class EnhancedConversationSerializer(serializers.ModelSerializer):
    """Enhanced conversation serializer with analysis and tags"""
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_image = serializers.SerializerMethodField()
    analysis = ConversationAnalysisSerializer(read_only=True)
    tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant', 'property', 'property_title',
            'property_image', 'last_message', 'unread_count', 'created_at',
            'updated_at', 'is_active', 'analysis', 'tags'
        ]
        read_only_fields = ['participants', 'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.get_other_participant(request.user)
            if other_user:
                return {
                    'id': other_user.id,
                    'username': other_user.username,
                    'email': other_user.email,
                    'role': get_user_role(other_user),
                    'avatar': other_user.profile.image.url if hasattr(other_user, 'profile') and other_user.profile.image else None
                }
        return None
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content,
                'sender_id': last_msg.sender.id,
                'sender_name': last_msg.sender.username,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read,
                'has_attachments': last_msg.attachments.exists()
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(
                sender__in=obj.participants.exclude(id=request.user.id),
                is_read=False
            ).count()
        return 0
    
    def get_property_image(self, obj):
        if obj.property and hasattr(obj.property, 'images'):
            first_image = obj.property.images.first()
            if first_image:
                return first_image.image.url
        return None
    
    def get_tags(self, obj):
        taggings = obj.tags.select_related('tag').all()
        return [
            {
                'id': t.tag.id,
                'name': t.tag.name,
                'color': t.tag.color
            }
            for t in taggings
        ]

