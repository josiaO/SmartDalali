from rest_framework import serializers
from .models import Conversation, Message, MessageNotification, Notification
from accounts.models import Profile
from accounts.roles import get_user_role


# Serializers from messaging app
class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'sender_role', 'sender_avatar', 'text', 'attachment', 'read_at', 'is_deleted', 'created_at']
        read_only_fields = ['sender', 'read_at', 'is_deleted', 'created_at']
    
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
            'id', 'user', 'agent', 'other_participant', 'property', 'property_title',
            'last_message', 'unread_count', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['user', 'agent', 'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.agent if request.user == obj.user else obj.user
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
        # We need to optimize this to avoid N+1 queries ideally, but for now logic:
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'text': last_msg.text,
                'sender_id': last_msg.sender.id,
                'sender_name': last_msg.sender.username,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read if hasattr(last_msg, 'is_read') else (last_msg.read_at is not None)
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            # Assuming is_read boolean exists on Message, wait, I removed it in models refactor above?
            # User requirement: Message(id, conversation, sender, text, attachment, created_at, read_at)
            # So I should filter by read_at__isnull=True.
            # But wait, MessageNotification also exists.
            # Let's check Message model again. I put read_at.
            # I will use read_at logic.
            return obj.messages.filter(read_at__isnull=True).exclude(sender=request.user).count()
        return 0


class CreateMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['text', 'attachment']
        extra_kwargs = {
            'text': {'required': False},
            'attachment': {'required': False}
        }
    
    def validate(self, data):
        if not data.get('text') and not data.get('attachment'):
            raise serializers.ValidationError("Message must contain either text or an attachment.")
        return data

    def create(self, validated_data):
        conversation = self.context['conversation']
        sender = self.context['request'].user
        
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            text=validated_data.get('text', ''),
            attachment=validated_data.get('attachment')
        )
        # Notifications creation is handled by signal or view
        return message


# Serializers from notifications app
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'is_read', 'created_at', 'related_object_id', 'related_object_type', 'data']
        read_only_fields = ['id', 'user', 'created_at']





