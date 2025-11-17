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

