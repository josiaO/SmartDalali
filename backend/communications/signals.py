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
        recipients = instance.conversation.participants.exclude(id=instance.sender_id)
        
        for user in recipients:
            # Check if user has SMS enabled in their profile
            if (hasattr(user, 'profile') and 
                user.profile.phone_number and 
                getattr(user.profile, 'sms_notifications_enabled', False)):
                
                # Send SMS notification
                notification_service.sms.send_message_alert(
                    user.profile.phone_number,
                    instance.sender.get_full_name() or instance.sender.username,
                    instance.content[:100]
                )
                logger.info(f"Twilio SMS sent to {user.username} for message {instance.id}")
    
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
        
        # Notify all participants except the creator
        for participant in instance.participants.all():
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
    
    Usage in celery beat:
    @periodic_task(run_every=timedelta(minutes=5))
    def check_timeouts():
        from communications.signals import check_agent_response_timeout
        check_agent_response_timeout()
    """
    from accounts.roles import get_user_role
    
    timeout_threshold = timezone.now() - timedelta(minutes=5)
    notification_service = get_notification_service()
    
    # Find conversations where last message was from user and no agent response
    conversations = Conversation.objects.filter(
        is_active=True,
        updated_at__lt=timeout_threshold
    ).prefetch_related('participants', 'messages')
    
    for conversation in conversations:
        last_message = conversation.get_last_message()
        
        if not last_message:
            continue
        
        # Check if last message was from a user (not agent)
        sender_role = get_user_role(last_message.sender)
        
        if sender_role == 'user':
            # Find agents in conversation
            for participant in conversation.participants.all():
                if get_user_role(participant) == 'agent':
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
    
    Args:
        user: User object
        booking_details: dict with 'property', 'time', 'date', 'agent'
    
    Usage:
        from communications.signals import send_booking_confirmation
        send_booking_confirmation(user, {
            'property': 'Modern 3BR Apartment',
            'time': '2:00 PM',
            'date': 'Tomorrow',
            'agent': 'John Doe'
        })
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
    
    Args:
        user: User object (property owner or agent)
        property_title: str
        offer_amount: str or number
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
