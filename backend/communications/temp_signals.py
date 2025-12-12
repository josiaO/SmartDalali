
from django.dispatch import receiver
from django.db.models.signals import post_save
from properties.models import PropertyVisit
from .models import Notification

@receiver(post_save, sender=PropertyVisit)
def notify_on_visit_change(sender, instance, created, **kwargs):
    """
    Notify users/agents when a visit is Requested (created) or Status Changed
    """
    notification_service = get_notification_service()
    
    if created:
        # 1. New Visit Request -> Notify Agent
        try:
            title = "New Visit Request"
            message = f"{instance.user.username} requested a visit for {instance.property.title} on {instance.date} at {instance.time}."
            
            # Create internal notification
            Notification.objects.create(
                user=instance.agent,
                title=title,
                message=message,
                type="visit",
                related_object_id=instance.id,
                related_object_type="visit"
            )
            
            # Send Email/SMS
            if notification_service:
                notification_service.notify_visit_request(
                   instance.agent,
                   instance.user.username,
                   instance.property.title,
                   f"{instance.date} {instance.time}"
                )

        except Exception as e:
            logger.error(f"Error notifying agent of visit request: {e}")
            
    else:
        # 2. Status Update -> Notify User (if confirmed/declined) or Agent (if cancelled)
        try:
            if instance.status in ['confirmed', 'declined']:
                # Agent acted -> Notify User
                target_user = instance.user
                title = f"Visit {instance.status.title()}"
                message = f"Your visit for {instance.property.title} has been {instance.status}."
                
                Notification.objects.create(
                    user=target_user,
                    title=title,
                    message=message,
                    type="visit",
                    related_object_id=instance.id,
                    related_object_type="visit"
                )
                
                 # Send Email/SMS if needed
                if notification_service:
                    # Generic alert or specific visit status alert
                     notification_service.sms.send_message_alert(
                        target_user.profile.phone_number if hasattr(target_user, 'profile') else None,
                        "SmartDalali",
                        message
                    )

            elif instance.status == 'cancelled':
                # User cancelled -> Notify Agent
                target_user = instance.agent
                title = "Visit Cancelled"
                message = f"Visit for {instance.property.title} by {instance.user.username} was cancelled."
                
                Notification.objects.create(
                    user=target_user,
                    title=title,
                    message=message,
                    type="visit",
                    related_object_id=instance.id,
                    related_object_type="visit"
                )
        except Exception as e:
             logger.error(f"Error notifying on visit status change: {e}")
