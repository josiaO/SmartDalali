"""
Notification services using third-party providers
"""
import os
from typing import Optional, List
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


class EmailNotificationService:
    """Send emails using SendGrid"""
    
    @staticmethod
    def send_message_notification(recipient_email: str, sender_name: str, message_preview: str):
        """Send email notification for new message"""
        try:
            subject = f"New message from {sender_name}"
            html_message = render_to_string('notifications/new_message.html', {
                'sender_name': sender_name,
                'message_preview': message_preview,
                'action_url': f"{settings.FRONTEND_URL}/messages"
            })
            
            send_mail(
                subject,
                f"New message from {sender_name}: {message_preview}",
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                html_message=html_message,
                fail_silently=True,
            )
            logger.info(f"Email notification sent to {recipient_email}")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
    
    @staticmethod
    def send_conversation_alert(recipient_email: str, property_title: str, participant_name: str):
        """Send email alert for new conversation"""
        try:
            subject = f"New inquiry about {property_title}"
            html_message = render_to_string('notifications/new_conversation.html', {
                'property_title': property_title,
                'participant_name': participant_name,
                'action_url': f"{settings.FRONTEND_URL}/messages"
            })
            
            send_mail(
                subject,
                f"New inquiry about {property_title} from {participant_name}",
                settings.DEFAULT_FROM_EMAIL,
                [recipient_email],
                html_message=html_message,
                fail_silently=True,
            )
            logger.info(f"Conversation alert sent to {recipient_email}")
        except Exception as e:
            logger.error(f"Failed to send conversation alert: {e}")


class SMSNotificationService:
    """Send SMS using Twilio"""
    
    def __init__(self):
        try:
            from twilio.rest import Client
            self.client = Client(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
            self.from_number = settings.TWILIO_PHONE_NUMBER
        except Exception as e:
            logger.error(f"Failed to initialize Twilio: {e}")
            self.client = None
    
    def send_message_alert(self, phone_number: str, sender_name: str, message_preview: str):
        """Send SMS alert for new message"""
        if not self.client:
            logger.warning("Twilio not configured")
            return
        
        try:
            message_body = f"New message from {sender_name}: {message_preview[:50]}..."
            self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=phone_number
            )
            logger.info(f"SMS sent to {phone_number}")
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
    
    def send_conversation_alert(self, phone_number: str, property_title: str):
        """Send SMS alert for new conversation"""
        if not self.client:
            logger.warning("Twilio not configured")
            return
        
        try:
            message_body = f"New inquiry about {property_title}. Check SmartDalali app for details."
            self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=phone_number
            )
            logger.info(f"Conversation SMS sent to {phone_number}")
        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")


class PushNotificationService:
    """Send push notifications using Firebase"""
    
    def __init__(self):
        try:
            import firebase_admin
            from firebase_admin import messaging
            
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            self.messaging = messaging
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self.messaging = None
    
    def send_message_notification(self, device_token: str, sender_name: str, message_preview: str):
        """Send push notification for new message"""
        if not self.messaging:
            logger.warning("Firebase not configured")
            return
        
        try:
            message = self.messaging.Message(
                notification=self.messaging.Notification(
                    title=f"Message from {sender_name}",
                    body=message_preview[:100],
                ),
                data={
                    'click_action': 'FLUTTER_NOTIFICATION_CLICK',
                    'type': 'message',
                },
                token=device_token,
            )
            response = self.messaging.send(message)
            logger.info(f"Push notification sent: {response}")
        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
    
    def send_conversation_notification(self, device_token: str, property_title: str, participant_name: str):
        """Send push notification for new conversation"""
        if not self.messaging:
            logger.warning("Firebase not configured")
            return
        
        try:
            message = self.messaging.Message(
                notification=self.messaging.Notification(
                    title=f"New inquiry",
                    body=f"{participant_name} inquired about {property_title}",
                ),
                data={
                    'click_action': 'FLUTTER_NOTIFICATION_CLICK',
                    'type': 'conversation',
                    'property_title': property_title,
                },
                token=device_token,
            )
            response = self.messaging.send(message)
            logger.info(f"Conversation push notification sent: {response}")
        except Exception as e:
            logger.error(f"Failed to send conversation notification: {e}")


class NotificationService:
    """Unified notification service"""
    
    def __init__(self):
        self.email = EmailNotificationService()
        self.sms = SMSNotificationService()
        self.push = PushNotificationService()
    
    def notify_new_message(
        self, 
        user, 
        sender_name: str, 
        message_preview: str,
        channels: Optional[List[str]] = None
    ):
        """
        Send notification through multiple channels
        channels: ['email', 'sms', 'push']
        """
        if channels is None:
            channels = ['email', 'push']
        
        try:
            if 'email' in channels and user.email:
                self.email.send_message_notification(
                    user.email, sender_name, message_preview
                )
            
            if 'sms' in channels and hasattr(user, 'profile') and user.profile.phone_number:
                self.sms.send_message_alert(
                    user.profile.phone_number, sender_name, message_preview
                )
            
            if 'push' in channels and hasattr(user, 'device_tokens'):
                for token in user.device_tokens.all():
                    self.push.send_message_notification(
                        token.token, sender_name, message_preview
                    )
        except Exception as e:
            logger.error(f"Error sending notifications: {e}")
    
    def notify_new_conversation(
        self,
        user,
        property_title: str,
        participant_name: str,
        channels: Optional[List[str]] = None
    ):
        """Send notification for new conversation"""
        if channels is None:
            channels = ['email', 'push']
        
        try:
            if 'email' in channels and user.email:
                self.email.send_conversation_alert(
                    user.email, property_title, participant_name
                )
            
            if 'sms' in channels and hasattr(user, 'profile') and user.profile.phone_number:
                self.sms.send_conversation_alert(
                    user.profile.phone_number, property_title
                )
            
            if 'push' in channels and hasattr(user, 'device_tokens'):
                for token in user.device_tokens.all():
                    self.push.send_conversation_notification(
                        token.token, property_title, participant_name
                    )
        except Exception as e:
            logger.error(f"Error sending conversation notifications: {e}")


# Singleton instance
_notification_service = None


def get_notification_service():
    """Get the notification service instance"""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService()
    return _notification_service
