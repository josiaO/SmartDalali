"""
Django Admin Configuration for SmartDalali

This module provides centralized admin site branding and dashboard statistics.
All model admins are registered in their respective app admin modules:
- accounts.admin: User and Profile
- properties.admin: Property, Payment, SupportTicket, etc.
- communications.admin: Conversation, Message, MessageNotification, etc.
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils import timezone

from properties.models import Property, Payment, SupportTicket
from communications.models import Conversation, MessageNotification

User = get_user_model()


# ============== Admin Site Branding ==============
admin.site.site_header = "SmartDalali Dashboard"
admin.site.site_title = "SmartDalali Admin"
admin.site.index_title = "Operational Overview"


# ============== Dashboard Statistics ==============
def _dashboard_stats():
    """Gather operational metrics for admin dashboard"""
    try:
        return {
            "total_users": User.objects.count(),
            "active_listings": Property.objects.filter(is_published=True).count(),
            "open_tickets": SupportTicket.objects.filter(status__in=['open', 'in_progress']).count(),
            "unread_messages": MessageNotification.objects.filter(is_read=False).count(),
            "conversations": Conversation.objects.count(),
            "pending_payments": Payment.objects.filter(status__in=['pending', 'confirmed']).count(),
            "timestamp": timezone.now(),
        }
    except Exception:
        # During migrations/tests tables might not exist yet
        return {
            "total_users": "-",
            "active_listings": "-",
            "open_tickets": "-",
            "unread_messages": "-",
            "conversations": "-",
            "pending_payments": "-",
            "timestamp": timezone.now(),
        }


# Inject dashboard stats into admin context
_original_each_context = admin.site.each_context


def custom_each_context(request):
    """Extend admin context with dashboard statistics"""
    context = _original_each_context(request)
    context["dashboard_stats"] = _dashboard_stats()
    return context


admin.site.each_context = custom_each_context


