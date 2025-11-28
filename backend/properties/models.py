from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.utils.translation import gettext_lazy as _
from datetime import timedelta
import uuid
from features.models import SubscriptionPlan

PROPERTY_TYPES = (
        ('House', _('House')),
        ('Apartment', _('Apartment')),
        ('Office', _('Office')),
        ('Land', _('Land')),
        ('Villa', _('Villa')),
        ('Shop', _('Shop')),
        ('Warehouse', _('Warehouse'))
)

STATUS_CHOICES = (
        ('active', _('Active')),
        ('inactive', _('Inactive')),
        ('sold', _('Sold')),
        ('rented', _('Rented')),
)



class AgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agentprofile')
    profile = models.OneToOneField('accounts.Profile', on_delete=models.CASCADE)
    agency_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    verified = models.BooleanField(default=False)
    subscription_active = models.BooleanField(default=False)
    subscription_expires = models.DateTimeField(blank=True, null=True)
    current_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name='subscribers')

    def __str__(self):
        return self.user.username
    
    class Meta:
        app_label = 'properties'


class Property(models.Model):
    #basic property informations
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    
    #Property details
    type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    area = models.FloatField(help_text="In square meters", null=True, blank=False)
    rooms = models.IntegerField(null=False, blank=False)
    bedrooms = models.IntegerField(null=False, blank=False)
    bathrooms = models.IntegerField(null=False, blank=False)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    parking = models.BooleanField(default=False)
    year_built = models.DateTimeField(null=True, blank=True)
    
    #location
    city = models.CharField(max_length=100)
    adress = models.CharField(max_length=300, blank=True)
    latitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True)
    longitude = models.DecimalField(max_digits=20, decimal_places=12, null=True, blank=True)
    google_place_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Publishing & Business Logic
    is_published = models.BooleanField(default=False)
    is_paid = models.BooleanField(default=False)
    featured_until = models.DateTimeField(null=True, blank=True)
    
    # Tracking
    view_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Archiving (for sold/rented properties)
    archived_at = models.DateTimeField(null=True, blank=True, help_text="When property was archived")
    auto_archive_days = models.IntegerField(default=7, help_text="Days before auto-archiving sold/rented properties")

    def get_lat_lng(self):
        """Return persisted latitude and longitude, if available."""
        if self.latitude is not None and self.longitude is not None:
            return str(self.latitude), str(self.longitude)
        return None, None
    
    def should_be_archived(self):
        """Check if property should be auto-archived based on status and time."""
        from django.utils import timezone
        from datetime import timedelta
        
        if self.archived_at:
            return False  # Already archived
        
        if self.status not in ['sold', 'rented']:
            return False  # Only archive sold/rented properties
        
        # Check if property has been in sold/rented status for auto_archive_days
        days_since_update = (timezone.now() - self.updated_at).days
        return days_since_update >= self.auto_archive_days
    
    def archive(self):
        """Archive this property."""
        from django.utils import timezone
        if not self.archived_at:
            self.archived_at = timezone.now()
            self.save(update_fields=['archived_at'])
    
    def unarchive(self):
        """Unarchive this property."""
        if self.archived_at:
            self.archived_at = None
            self.save(update_fields=['archived_at'])

    def __str__(self):
        return self.title
    
    class Meta:
        app_label = 'properties'
        
class MediaProperty(models.Model):
    property = models.ForeignKey(Property, related_name="MediaProperty", on_delete=models.CASCADE, null=True, blank=True)
    Images = models.ImageField(upload_to='property_images/', null=True, blank=False)
    videos = models.FileField(upload_to='property_videos', null=True, blank=True,
                              validators=[FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'webm'])]
                              )
    caption = models.TextField(max_length=100, blank=True)
    class Meta:
        app_label = 'properties'
        
class PropertyFeature(models.Model):
    features = models.CharField(max_length=100)
    property = models.ForeignKey(Property,related_name="property_features", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        app_label = 'properties'

class PropertyVisit(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='visits')
    visitor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='property_visits')
    scheduled_time = models.DateTimeField()
    status_choices = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=status_choices, default='pending')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Visit to {self.property.title} by {self.visitor.username} on {self.scheduled_time}"

class PropertyView(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='unique_views')
    viewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='property_views')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('property', 'viewer')
        app_label = 'properties'
        ordering = ['-viewed_at']


# Models from payments app
class Payment(models.Model):
    PAYMENT_METHODS = (
        ('mpesa', 'M-Pesa'),
        ('stripe', 'Stripe'),
    )

    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_id = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=32, choices=PAYMENT_STATUS)
    raw_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'properties'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.method} {self.amount} {self.status}"


# Models from support app
class SupportTicket(models.Model):
    PRIORITY_CHOICES = (
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    )
    
    STATUS_CHOICES = (
        ('open', _('Open')),
        ('in_progress', _('In Progress')),
        ('resolved', _('Resolved')),
        ('closed', _('Closed')),
    )
    
    CATEGORY_CHOICES = (
        ('account', _('Account Issues')),
        ('property', _('Property Listing')),
        ('payment', _('Payment & Billing')),
        ('technical', _('Technical Support')),
        ('report', _('Report a Problem')),
        ('feature', _('Feature Request')),
        ('other', _('Other')),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=20, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    admin_reply = models.TextField(blank=True, null=True)
    user_reply = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        app_label = 'properties'
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = f"SD-{timezone.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.ticket_number} - {self.title}"


class TicketReply(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='replies')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    is_admin_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        app_label = 'properties'
    
    def __str__(self):
        return f"Reply to {self.ticket.ticket_number} by {self.user.username}"


class AgentRating(models.Model):
    """Agent ratings and reviews from users."""
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='received_ratings',
        help_text="The agent being rated"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='given_ratings',
        help_text="The user giving the rating"
    )
    rating = models.IntegerField(
        help_text="Rating from 1 to 5 stars"
    )
    review = models.TextField(blank=True, null=True, help_text="Optional review text")
    property = models.ForeignKey(
        Property,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agent_ratings',
        help_text="Property this rating is related to (optional)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        app_label = 'properties'
        # Ensure one rating per user per agent
        unique_together = ['agent', 'user']
    
    def __str__(self):
        return f"{self.user.username} rated {self.agent.username}: {self.rating}/5"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.rating < 1 or self.rating > 5:
            raise ValidationError('Rating must be between 1 and 5')
        if self.agent == self.user:
            raise ValidationError('Users cannot rate themselves')


class PropertyLike(models.Model):
    """
    Track user likes/favorites for properties
    """
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_properties')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'properties'
        unique_together = ('property', 'user')  # Prevent duplicate likes
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} likes {self.property.title}"
