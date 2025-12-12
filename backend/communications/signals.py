"""
Django signals for Twilio notification triggers
Handles event-based SMS/WhatsApp notifications
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Message, Conversation
from .notification_service import get_notification_service
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Message)
def trigger_twilio_on_new_message(sender, instance, created, **kwargs):
    """
    Trigger Twilio SMS/WhatsApp when new message arrives
    Only sends if user has SMS notifications enabled
    """
    if not created:
        return
    
    try:
        notification_service = get_notification_service()
        # Recipient is the other person in conversation
        recipient = instance.conversation.agent if instance.conversation.user == instance.sender else instance.conversation.user
        
        # Check if user has SMS enabled in their profile
        if (hasattr(recipient, 'profile') and 
            recipient.profile.phone_number and 
            getattr(recipient.profile, 'sms_notifications_enabled', False)):
            
            # Send SMS notification
            notification_service.sms.send_message_alert(
                recipient.profile.phone_number,
                instance.sender.get_full_name() or instance.sender.username,
                instance.text[:100]
            )
            logger.info(f"Twilio SMS sent to {recipient.username} for message {instance.id}")
    
    except Exception as e:
        logger.error(f"Error sending Twilio notification: {e}")


@receiver(post_save, sender=Conversation)
def trigger_twilio_on_new_conversation(sender, instance, created, **kwargs):
    """
    Trigger Twilio notification when new conversation starts
    Useful for agents to know about new inquiries
    """
    if not created:
        return
    
    try:
        notification_service = get_notification_service()
        
        # Notify both user and agent (or just agent usually)
        # Typically new conversation = user contacting agent. So notify agent.
        participants = [instance.user, instance.agent]
        
        for participant in participants:
            if (hasattr(participant, 'profile') and 
                participant.profile.phone_number and
                getattr(participant.profile, 'sms_notifications_enabled', False)):
                
                property_title = instance.property.title if instance.property else "a property"
                notification_service.sms.send_conversation_alert(
                    participant.profile.phone_number,
                    property_title
                )
                logger.info(f"Twilio conversation alert sent to {participant.username}")
    
    except Exception as e:
        logger.error(f"Error sending Twilio conversation alert: {e}")


def check_agent_response_timeout():
    """
    Celery task to check for agent response timeouts
    Should be called periodically (e.g., every 5 minutes)
    """
    from accounts.roles import get_user_role
    
    timeout_threshold = timezone.now() - timedelta(minutes=5)
    notification_service = get_notification_service()
    
    # Find active conversations updated before threshold
    conversations = Conversation.objects.filter(
        is_active=True,
        updated_at__lt=timeout_threshold
    ).prefetch_related('messages')
    
    for conversation in conversations:
        # Check last message
        last_message = conversation.messages.order_by('-created_at').first()
        
        if not last_message:
            continue
        
        # Check if last message was from a user (requester)
        # Assuming conversation.user is requester, conversation.agent is agent.
        
        if last_message.sender == conversation.user:
            # User sent last message, agent hasn't replied.
            participant = conversation.agent
            
             # Send urgent SMS to agent
            if (hasattr(participant, 'profile') and 
                participant.profile.phone_number and
                getattr(participant.profile, 'sms_notifications_enabled', False)):
                
                property_title = conversation.property.title if conversation.property else "a property"
                message = f"⚠️ Urgent: User waiting for response on {property_title}. Reply now!"
                
                notification_service.sms.send_message_alert(
                    participant.profile.phone_number,
                    "SmartDalali Alert",
                    message
                )
                logger.info(f"Timeout alert sent to agent {participant.username}")


def send_booking_confirmation(user, booking_details):
    """
    Send booking confirmation via Twilio
    """
    try:
        if (hasattr(user, 'profile') and 
            user.profile.phone_number and
            getattr(user.profile, 'sms_notifications_enabled', False)):
            
            notification_service = get_notification_service()
            
            message = (
                f"✅ Viewing Confirmed!\n"
                f"Property: {booking_details['property']}\n"
                f"Date: {booking_details['date']}\n"
                f"Time: {booking_details['time']}\n"
                f"Agent: {booking_details['agent']}\n"
                f"See you there!"
            )
            
            notification_service.sms.send_message_alert(
                user.profile.phone_number,
                "SmartDalali",
                message
            )
            logger.info(f"Booking confirmation sent to {user.username}")
    
    except Exception as e:
        logger.error(f"Error sending booking confirmation: {e}")


def send_price_negotiation_alert(user, property_title, offer_amount):
    """
    Send SMS alert when price offer is made
    """
    try:
        if (hasattr(user, 'profile') and 
            user.profile.phone_number and
            getattr(user.profile, 'sms_notifications_enabled', False)):
            
            notification_service = get_notification_service()
            
            message = f"💰 New offer on {property_title}: {offer_amount}. Check app for details."
            
            notification_service.sms.send_message_alert(
                user.profile.phone_number,
                "SmartDalali",
                message
            )
            logger.info(f"Price negotiation alert sent to {user.username}")
    
    except Exception as e:
        logger.error(f"Error sending price negotiation alert: {e}")

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
