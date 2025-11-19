"""
Django Admin Configuration for SmartDalali

Centralized admin customization with modern dashboard statistics.
All model admins are registered in their respective app admin modules.
"""

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count

from properties.models import Property, Payment, SupportTicket
from communications.models import Conversation, Message, MessageNotification, Notification
User = get_user_model()


# ============== Admin Site Customization ==============
admin.site.site_header = "SmartDalali Administration"
admin.site.site_title = "SmartDalali Admin"
admin.site.index_title = "Dashboard Overview"


# ============== Dashboard Statistics ==============
def _dashboard_stats():
    """Gather operational metrics for admin dashboard"""
    try:
        return {
            "total_users": User.objects.count(),
            "total_agents": User.objects.filter(role="agent").count(),
            "active_listings": Property.objects.filter(is_published=True).count(),
            "total_listings": Property.objects.count(),
            "open_tickets": SupportTicket.objects.filter(
                status__in=["open", "in_progress"]
            ).count(),
            "resolved_tickets": SupportTicket.objects.filter(status="resolved").count(),
            "unread_messages": MessageNotification.objects.filter(is_read=False).count(),
            "conversations": Conversation.objects.count(),
            "pending_payments": Payment.objects.filter(
                status__in=["pending", "confirmed"]
            ).count(),
            "confirmed_payments": Payment.objects.filter(status="confirmed").count(),
            "total_revenue": Payment.objects.filter(status="confirmed").aggregate(
                total=Count("id")
            )["total"],
            "timestamp": timezone.now(),
        }
    except Exception:
        # During migrations/tests tables might not exist yet
        return {
            "total_users": "-",
            "total_agents": "-",
            "active_listings": "-",
            "total_listings": "-",
            "open_tickets": "-",
            "resolved_tickets": "-",
            "unread_messages": "-",
            "conversations": "-",
            "pending_payments": "-",
            "confirmed_payments": "-",
            "total_revenue": "-",
            "timestamp": timezone.now(),
        }


# ============== Dashboard Index ==============
_original_each_context = admin.site.each_context


def custom_each_context(request):
    """Extend admin context with dashboard statistics"""
    context = _original_each_context(request)
    stats = _dashboard_stats()

    # Format dashboard stats for display
    context["dashboard_stats"] = stats
    context["app_list_title"] = "Management"

    # Add quick stats display
    context["quick_stats"] = [
        {
            "label": "Total Users",
            "value": stats.get("total_users", "-"),
            "color": "blue",
            "icon": "👥",
        },
        {
            "label": "Active Listings",
            "value": stats.get("active_listings", "-"),
            "color": "green",
            "icon": "🏢",
        },
        {
            "label": "Open Tickets",
            "value": stats.get("open_tickets", "-"),
            "color": "orange",
            "icon": "🎫",
        },
        {
            "label": "Unread Messages",
            "value": stats.get("unread_messages", "-"),
            "color": "purple",
            "icon": "💬",
        },
    ]

    return context


admin.site.each_context = custom_each_context


