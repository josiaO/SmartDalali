from django.contrib import admin
from .models import Conversation, Message, MessageNotification, Notification


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'agent', 'property', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'agent__username', 'property__title']
    
    # participants removed, user/agent are FKs


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'text_preview', 'read_at', 'has_attachment', 'created_at']
    list_filter = ['read_at', 'created_at']
    search_fields = ['sender__username', 'text', 'conversation__user__username', 'conversation__agent__username']
    readonly_fields = ['created_at']
    
    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Text Preview'
    
    def has_attachment(self, obj):
        return bool(obj.attachment)
    has_attachment.boolean = True
    has_attachment.short_description = 'Attachment'


@admin.register(MessageNotification)
class MessageNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'message__text']
    readonly_fields = ['created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['is_read', 'type', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['id', 'created_at']


