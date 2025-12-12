from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_user')
    agent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations_as_agent')
    property = models.ForeignKey('properties.Property', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        app_label = 'communications'
        ordering = ['-updated_at']
        # Removed unique_together to allow multiple conversation threads
        # Users can have fresh conversations after deleting old ones
    
    hidden_by = models.ManyToManyField(User, related_name='hidden_conversations', blank=True)

    def __str__(self):
        return f"Conversation: {self.user.username} - {self.agent.username} ({self.property.title if self.property else 'No Property'})"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()  # Legacy plaintext field
    text_encrypted = models.TextField(null=True, blank=True)  # Encrypted message content
    is_encrypted = models.BooleanField(default=False)  # Flag to indicate if message is encrypted
    attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    hidden_by = models.ManyToManyField(User, related_name='hidden_messages', blank=True)

    class Meta:
        ordering = ['created_at']
        app_label = 'communications'
    
    def save(self, *args, **kwargs):
        """Auto-encrypt message text on save"""
        if self.text and not self.is_encrypted:
            try:
                from .encryption import get_encryptor
                encryptor = get_encryptor()
                self.text_encrypted = encryptor.encrypt(self.text)
                self.is_encrypted = True
            except Exception as e:
                # Log error but don't fail the save
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to encrypt message: {e}")
        super().save(*args, **kwargs)
    
    @property
    def decrypted_text(self):
        """Get decrypted message text"""
        if self.is_encrypted and self.text_encrypted:
            try:
                from .encryption import get_encryptor
                encryptor = get_encryptor()
                return encryptor.decrypt(self.text_encrypted)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to decrypt message: {e}")
                return "[Encrypted message]"
        return self.text

    def __str__(self):
        return f"Message from {self.sender.username}"


class MessageNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='message_notifications')
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'communications'

    def __str__(self):
        return f"Notification for {self.user.username} about message {self.message.id}"


# Models from notifications app
class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50)  # message, visit, support, update
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Generic relation fields for linking to any object (Message, Visit, etc)
    related_object_id = models.IntegerField(null=True, blank=True)
    # Storing type string instead of ContentType for simplicity as per request
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Keeping 'data' field for extra flexibility if needed, though not in strict request, it's safer to keep for backward compat or extra payload
    data = models.JSONField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        app_label = 'communications'

    def __str__(self):
        return f"{self.type}: {self.title}"


