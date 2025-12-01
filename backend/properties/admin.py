from django.contrib import admin
from .models import (
    AgentProfile, Property, MediaProperty, PropertyFeature, PropertyVisit,
    Payment, SupportTicket, TicketMessage, TicketAttachment, PropertyLike,
    AgentRating
)

@admin.register(AgentProfile)
class AgentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'agency_name', 'phone', 'verified', 'subscription_active', 'subscription_expires')
    search_fields = ('user__username', 'agency_name', 'phone')

    actions = ['activate_subscription', 'deactivate_subscription']


    def activate_subscription(self, request, queryset):
        from django.utils import timezone
        import datetime
        for agent in queryset:
            agent.subscription_active = True
            agent.subscription_expires = timezone.now() + datetime.timedelta(days=30)
            agent.save()
        self.message_user(request, "Selected agents' subscriptions activated for 1 month.")
    activate_subscription.short_description = "Activate subscription for 1 month"


    def deactivate_subscription(self, request, queryset):
        for agent in queryset:
            agent.subscription_active = False
            agent.subscription_expires = None
            agent.save()
        self.message_user(request, "Selected agents' subscriptions deactivated.")
    deactivate_subscription.short_description = "Deactivate subscription"


class MediaPropertyTabularInline(admin.TabularInline):
    model = MediaProperty
    
#class FeaturesTabularInline(admin.TabularInline):
   #model = Features

@admin.register(Property)
class PropertyInline(admin.ModelAdmin):
    list_display = ('title','price', 'city', 'created_at', 'google_place_id')
    list_filter = ('city', 'created_at')
    search_fields = ('title', 'description', 'city', 'google_place_id')
    inlines = [MediaPropertyTabularInline]


@admin.register(PropertyFeature)
class PropertyFeatureAdmin(admin.ModelAdmin):
    list_display = ('features', 'property')
    search_fields = ('features',)


@admin.register(PropertyVisit)
class PropertyVisitAdmin(admin.ModelAdmin):
    list_display = ('property', 'visitor', 'scheduled_time', 'status')
    list_filter = ('status',)
    search_fields = ('property__title', 'visitor__username')


# Admin from payments app
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'property', 'method', 'amount', 'status', 'created_at')
    search_fields = ('user__username', 'property__title', 'transaction_id')
    list_filter = ('method', 'status', 'created_at')

    actions = ['mark_reviewed', 'flag_payment']

    def mark_reviewed(self, request, queryset):
        queryset.update(status='confirmed')
        self.message_user(request, "Selected payments marked as confirmed.")
    mark_reviewed.short_description = "Mark selected payments as confirmed"

    def flag_payment(self, request, queryset):
        queryset.update(status='cancelled')
        self.message_user(request, "Selected payments cancelled.")
    flag_payment.short_description = "Cancel selected payments"


class TicketMessageInline(admin.TabularInline):
    model = TicketMessage
    extra = 0
    readonly_fields = ('sender', 'sender_type', 'created_at')

class TicketAttachmentInline(admin.TabularInline):
    model = TicketAttachment
    extra = 0

# Admin from support app
@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('ticket_number', 'subject', 'user', 'status', 'priority', 'created_at')
    list_filter = ('status', 'priority', 'category')
    search_fields = ('ticket_number', 'subject', 'description', 'user__username', 'user__email')
    readonly_fields = ('ticket_number', 'created_at', 'updated_at', 'ai_summary', 'ai_topic', 'ai_sentiment')
    inlines = [TicketMessageInline]
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('ticket_number', 'subject', 'description', 'user', 'assigned_to')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'category')
        }),
        ('AI Analysis', {
            'fields': ('ai_summary', 'ai_topic', 'ai_sentiment'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'closed_at')
        }),
    )


@admin.register(TicketMessage)
class TicketMessageAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'sender', 'sender_type', 'created_at')
    list_filter = ('sender_type', 'created_at')
    search_fields = ('message', 'ticket__ticket_number')
    inlines = [TicketAttachmentInline]


@admin.register(PropertyLike)
class PropertyLikeAdmin(admin.ModelAdmin):
    list_display = ['property', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['property__title', 'user__username']
    readonly_fields = ['created_at']



@admin.register(AgentRating)
class AgentRatingAdmin(admin.ModelAdmin):
    list_display = ['agent', 'user', 'rating', 'property', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['agent__username', 'user__username', 'property__title']
    readonly_fields = ['created_at', 'updated_at']
