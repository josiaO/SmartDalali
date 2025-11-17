from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils import timezone

from properties.models import Property, Payment, SupportTicket
from communications.models import Conversation, MessageNotification


# Brand the admin
admin.site.site_header = "SmartDalali Dashboard"
admin.site.site_title = "SmartDalali Admin"
admin.site.index_title = "Operational Overview"
admin.site.index_template = "admin/dashboard.html"


def _dashboard_stats():
    User = get_user_model()
    return {
        "total_users": User.objects.count(),
        "active_listings": Property.objects.filter(is_published=True).count(),
        "open_tickets": SupportTicket.objects.filter(status__in=['open', 'in_progress']).count(),
        "unread_messages": MessageNotification.objects.filter(is_read=False).count(),
        "conversations": Conversation.objects.count(),
        "pending_payments": Payment.objects.filter(status__in=['pending', 'confirmed']).count(),
        "timestamp": timezone.now(),
    }


_original_each_context = admin.site.each_context


def custom_each_context(request):
    context = _original_each_context(request)
    try:
        context["dashboard_stats"] = _dashboard_stats()
    except Exception:
        # During migrations/tests tables might not exist yet
        context["dashboard_stats"] = {
            "total_users": "-",
            "active_listings": "-",
            "open_tickets": "-",
            "unread_messages": "-",
            "conversations": "-",
            "pending_payments": "-",
            "timestamp": timezone.now(),
        }
    return context


admin.site.each_context = custom_each_context


