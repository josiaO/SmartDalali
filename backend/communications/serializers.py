from rest_framework import serializers
from .models import Conversation, Message, MessageNotification, Notification
from accounts.models import Profile
from accounts.roles import get_user_role


# Serializers from messaging app

class MinimalMessageSerializer(serializers.ModelSerializer):
    """Minimal serializer for reply_to field"""
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender_name', 'text', 'attachment', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    reply_to = MinimalMessageSerializer(read_only=True)
    reply_to_id = serializers.PrimaryKeyRelatedField(
        queryset=Message.objects.all(), source='reply_to', write_only=True, required=False, allow_null=True
    )
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'sender_role', 'sender_avatar', 'text', 'attachment', 'read_at', 'is_deleted', 'created_at', 'reply_to', 'reply_to_id']
        read_only_fields = ['sender', 'read_at', 'is_deleted', 'created_at']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # Use decrypted text for encrypted messages
        if instance.is_encrypted:
            data['text'] = instance.decrypted_text
        
        # Handle Global Deletion (Delete for Everyone)
        if instance.is_deleted:
            data['text'] = "This message was deleted"
            data['attachment'] = None
            data['is_deleted'] = True
            
        # Handle Deleted User
        try:
            if hasattr(instance.sender, 'profile') and instance.sender.profile.is_deleted:
                data['sender_name'] = "Deleted User"
                data['sender_avatar'] = None # Or provide a generic URL if needed
                # We keep sender_id (data['sender']) for linking but UI shows deleted
        except Exception:
            pass
            
        return data

    def get_sender_role(self, obj):
        # ... existing logic ...
        try:
            if hasattr(obj.sender, 'profile') and obj.sender.profile.is_deleted:
                return 'user' # Flatten role for deleted user
            return get_user_role(obj.sender)
        except:
            return 'user'
    
    def get_sender_avatar(self, obj):
        try:
            if hasattr(obj.sender, 'profile'):
                if obj.sender.profile.is_deleted:
                    return None
                if obj.sender.profile.image:
                    return obj.sender.profile.image.url
        except:
            pass
        return None


class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    property_title = serializers.CharField(source='property.title', read_only=True)
    property_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'user', 'agent', 'other_participant', 'property', 'property_title', 'property_image',
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
        request = self.context.get('request')
        qs = obj.messages.all()
        if request and request.user:
            qs = qs.exclude(hidden_by=request.user)
            
        last_msg = qs.order_by('-created_at').first()
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
    
    def get_property_image(self, obj):
        """Get the main image URL for the property"""
        if not obj.property:
            return None
        
        try:
            # Get first MediaProperty image
            first_media = obj.property.MediaProperty.first()
            if first_media and first_media.Images:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_media.Images.url)
                return first_media.Images.url
        except Exception:
            pass
        return None


class CreateMessageSerializer(serializers.ModelSerializer):
    reply_to_id = serializers.PrimaryKeyRelatedField(
        queryset=Message.objects.all(), source='reply_to', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Message
        fields = ['text', 'attachment', 'reply_to_id']
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
            attachment=validated_data.get('attachment'),
            reply_to=validated_data.get('reply_to')
        )
        # Notifications creation is handled by signal or view
        return message


# Serializers from notifications app
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'type', 'title', 'message', 'is_read', 'created_at', 'related_object_id', 'related_object_type', 'data']
        read_only_fields = ['id', 'user', 'created_at']





