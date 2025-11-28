from django.contrib import admin
from .models import (
    Conversation, Message, MessageNotification, Notification,
    MessageAttachment, MessageThread, ConversationAnalysis,
    ConversationTag, ConversationTagging, MessageReaction
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_participants', 'property', 'is_active', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['participants__username', 'property__title']
    filter_horizontal = ['participants']
    
    def get_participants(self, obj):
        return ', '.join([p.username for p in obj.participants.all()])
    get_participants.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'content_preview', 'is_read', 'has_attachments', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['sender__username', 'content', 'conversation__participants__username']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
    
    def has_attachments(self, obj):
        return obj.attachments.exists()
    has_attachments.boolean = True
    has_attachments.short_description = 'Attachments'


@admin.register(MessageNotification)
class MessageNotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'message', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['user__username', 'message__content']
    readonly_fields = ['created_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'title', 'read', 'created_at']
    list_filter = ['read', 'type', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['id', 'created_at']


# New model admins
@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'file_name', 'file_type', 'file_size_display', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['file_name', 'message__content']
    readonly_fields = ['uploaded_at', 'file_size']
    
    def file_size_display(self, obj):
        return obj.get_file_size_display()
    file_size_display.short_description = 'File Size'


@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ['id', 'parent_message', 'reply_message', 'created_at']
    list_filter = ['created_at']
    search_fields = ['parent_message__content', 'reply_message__content']
    readonly_fields = ['created_at']


@admin.register(ConversationAnalysis)
class ConversationAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sentiment', 'intent', 'priority', 'analyzed_at']
    list_filter = ['sentiment', 'intent', 'priority', 'analyzed_at']
    search_fields = ['conversation__participants__username', 'key_topics', 'action_items']
    readonly_fields = ['analyzed_at']


@admin.register(ConversationTag)
class ConversationTagAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'color', 'get_conversation_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at']
    
    def get_conversation_count(self, obj):
        return obj.conversations.count()
    get_conversation_count.short_description = 'Conversations'


@admin.register(ConversationTagging)
class ConversationTaggingAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'tag', 'tagged_by', 'tagged_at']
    list_filter = ['tag', 'tagged_at']
    search_fields = ['conversation__participants__username', 'tag__name']
    readonly_fields = ['tagged_at']


@admin.register(MessageReaction)
class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'emoji', 'created_at']
    list_filter = ['emoji', 'created_at']
    search_fields = ['user__username', 'message__content']
    readonly_fields = ['created_at']


