from django.contrib import admin
from .models import (
    AgentProfile, Property, MediaProperty, Features, PropertyVisit,
    Payment, SupportTicket, TicketReply
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


@admin.register(Features)
class FeaturesAdmin(admin.ModelAdmin):
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


# Admin from support app
@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'title', 'user', 'category', 'priority', 'status', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['ticket_number', 'title', 'user__username', 'user__email']
    readonly_fields = ['ticket_number', 'created_at', 'updated_at']
    list_editable = ['status', 'assigned_to']
    
    fieldsets = (
        ('Ticket Information', {
            'fields': ('ticket_number', 'user', 'title', 'description', 'category', 'priority', 'status')
        }),
        ('Assignment', {
            'fields': ('assigned_to',)
        }),
        ('Replies', {
            'fields': ('admin_reply', 'user_reply')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'closed_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TicketReply)
class TicketReplyAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'user', 'is_admin_reply', 'created_at']
    list_filter = ['is_admin_reply', 'created_at']
    search_fields = ['ticket__ticket_number', 'user__username', 'message']
    readonly_fields = ['created_at']
