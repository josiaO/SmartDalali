from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.contrib.auth.models import User
import uuid


# Models from messaging app
class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    property = models.ForeignKey('properties.Property', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def get_other_participant(self, user):
        return self.participants.exclude(id=user.id).first()

    def get_last_message(self):
        return self.messages.order_by('-created_at').first()

    def __str__(self):
        return f"Conversation between {', '.join([p.username for p in self.participants.all()])}"

    class Meta:
        app_label = 'communications'


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        app_label = 'communications'

    def __str__(self):
        return f"Message from {self.sender.username} in {self.conversation.id}"

    def mark_as_read(self):
        self.is_read = True
        self.save()


class MessageNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_notifications')
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'communications'

    def __str__(self):
        return f"Notification for {self.user.username} about message {self.message.id}"


@receiver(post_save, sender=Message)
def create_message_notifications(sender, instance, created, **kwargs):
    """
    Auto-create MessageNotification rows whenever a new message is stored.
    Ensures tests and realtime logic stay consistent even if messages are created outside serializers.
    """
    if not created:
        return
    recipients = instance.conversation.participants.exclude(id=instance.sender_id)
    for user in recipients:
        MessageNotification.objects.create(user=user, message=instance)


# Models from notifications app
class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        app_label = 'communications'

    def __str__(self):
        return self.title


# Enhanced models for Phase 1 features
class MessageAttachment(models.Model):
    """File attachments for messages (images, documents, PDFs)"""
    FILE_TYPES = [
        ('image', 'Image'),
        ('document', 'Document'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('other', 'Other'),
    ]
    
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='message_attachments/%Y/%m/%d/')
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text='File size in bytes')
    mime_type = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'communications'
        ordering = ['uploaded_at']
    
    def __str__(self):
        return f"{self.file_name} ({self.file_type})"
    
    def get_file_size_display(self):
        """Return human-readable file size"""
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"


class MessageThread(models.Model):
    """For threaded replies within conversations"""
    parent_message = models.ForeignKey(
        Message, 
        on_delete=models.CASCADE, 
        related_name='thread_children'
    )
    reply_message = models.OneToOneField(
        Message, 
        on_delete=models.CASCADE, 
        related_name='thread_parent'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'communications'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['parent_message', 'created_at']),
        ]
    
    def __str__(self):
        return f"Reply to message {self.parent_message.id}"


class ConversationAnalysis(models.Model):
    """AI-generated insights for conversations"""
    INTENT_CHOICES = [
        ('inquiry', 'Property Inquiry'),
        ('negotiation', 'Price Negotiation'),
        ('viewing_request', 'Viewing Request'),
        ('complaint', 'Complaint'),
        ('follow_up', 'Follow Up'),
        ('general', 'General Discussion'),
    ]
    
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]
    
    conversation = models.OneToOneField(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='analysis'
    )
    sentiment = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, default='neutral')
    sentiment_score = models.FloatField(
        null=True, 
        blank=True,
        help_text='Score from -1.0 (negative) to 1.0 (positive)'
    )
    intent = models.CharField(max_length=50, choices=INTENT_CHOICES, default='general')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    suggested_response = models.TextField(null=True, blank=True)
    key_topics = models.JSONField(
        default=list,
        help_text='List of key topics discussed'
    )
    action_items = models.JSONField(
        default=list,
        help_text='Extracted action items or next steps'
    )
    analyzed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'communications'
        verbose_name_plural = 'Conversation analyses'
    
    def __str__(self):
        return f"Analysis for conversation {self.conversation.id} - {self.intent}"


class ConversationTag(models.Model):
    """Tags for categorizing and filtering conversations"""
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7, default='#6B7280', help_text='Hex color code')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'communications'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ConversationTagging(models.Model):
    """Many-to-many relationship for conversation tags"""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='tags')
    tag = models.ForeignKey(ConversationTag, on_delete=models.CASCADE, related_name='conversations')
    tagged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    tagged_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'communications'
        unique_together = ['conversation', 'tag']
        ordering = ['tagged_at']
    
    def __str__(self):
        return f"{self.conversation.id} - {self.tag.name}"


class MessageReaction(models.Model):
    """Emoji reactions to messages"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        app_label = 'communications'
        unique_together = ['message', 'user', 'emoji']
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['message', 'emoji']),
        ]
    
    def __str__(self):
        return f"{self.user.username} reacted {self.emoji} to message {self.message.id}"


# Update Message model to add search capabilities
# Add this after the Message class is fully defined
try:
    from django.contrib.postgres.indexes import GinIndex
    from django.contrib.postgres.search import SearchVectorField
    
    # Add search vector field to Message model
    Message.add_to_class('search_vector', SearchVectorField(null=True, blank=True))
    
    # Update Meta to include GIN index for full-text search
    if hasattr(Message, '_meta'):
        Message._meta.indexes.append(
            GinIndex(fields=['search_vector'], name='message_search_idx')
        )
except ImportError:
    # PostgreSQL not available, skip search enhancements
    pass

