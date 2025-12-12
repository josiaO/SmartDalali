"""
Analytics models for tracking agent dashboard metrics.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone


class PropertyViewEvent(models.Model):
    """
    Track individual property view events for detailed analytics.
    """
    DEVICE_TYPES = (
        ('mobile', 'Mobile'),
        ('desktop', 'Desktop'),
        ('tablet', 'Tablet'),
        ('unknown', 'Unknown'),
    )
    
    property = models.ForeignKey(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='view_events'
    )
    viewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='property_view_events'
    )
    device_type = models.CharField(max_length=10, choices=DEVICE_TYPES, default='unknown')
    viewed_at = models.DateTimeField(auto_now_add=True, db_index=True)
    session_id = models.CharField(max_length=100, blank=True, null=True)
    location_city = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        app_label = 'properties'
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['property', '-viewed_at']),
            models.Index(fields=['viewer', '-viewed_at']),
            models.Index(fields=['device_type']),
        ]
    
    def __str__(self):
        viewer_name = self.viewer.username if self.viewer else 'Anonymous'
        return f"{viewer_name} viewed {self.property.title} on {self.viewed_at}"


class PropertyEngagement(models.Model):
    """
    Aggregated engagement metrics per property.
    """
    property = models.OneToOneField(
        'properties.Property',
        on_delete=models.CASCADE,
        related_name='engagement_metrics'
    )
    total_shares = models.PositiveIntegerField(default=0)
    total_contact_attempts = models.PositiveIntegerField(default=0)
    total_likes = models.PositiveIntegerField(default=0)
    last_engagement = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'properties'
    
    def __str__(self):
        return f"Engagement metrics for {self.property.title}"
    
    def update_likes_count(self):
        """Update total likes from PropertyLike model"""
        from properties.models import PropertyLike
        self.total_likes = PropertyLike.objects.filter(property=self.property).count()
        self.save(update_fields=['total_likes', 'updated_at'])


class AgentLeadMetrics(models.Model):
    """
    Daily aggregated lead metrics per agent for performance tracking.
    """
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lead_metrics'
    )
    date = models.DateField(db_index=True)
    new_messages = models.PositiveIntegerField(default=0)
    conversations_started = models.PositiveIntegerField(default=0)
    response_time_minutes = models.PositiveIntegerField(
        default=0,
        help_text="Average response time in minutes"
    )
    total_responses = models.PositiveIntegerField(
        default=0,
        help_text="Number of responses sent this day"
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        app_label = 'properties'
        ordering = ['-date']
        unique_together = ['agent', 'date']
        indexes = [
            models.Index(fields=['agent', '-date']),
        ]
    
    def __str__(self):
        return f"Lead metrics for {self.agent.username} on {self.date}"


class GeographicInsight(models.Model):
    """
    Track location-based search and view patterns.
    """
    location_name = models.CharField(max_length=100, db_index=True)
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='geographic_insights',
        null=True,
        blank=True,
        help_text="Agent whose properties are being viewed (null for global)"
    )
    search_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    date = models.DateField(db_index=True)
    
    class Meta:
        app_label = 'properties'
        ordering = ['-date', '-view_count']
        unique_together = ['location_name', 'agent', 'date']
        indexes = [
            models.Index(fields=['agent', '-date']),
            models.Index(fields=['location_name', '-date']),
        ]
    
    def __str__(self):
        agent_name = self.agent.username if self.agent else 'Global'
        return f"{self.location_name} - {agent_name} ({self.date})"


class WeeklyEngagementPattern(models.Model):
    """
    Track weekly engagement patterns for agents (for heatmap visualization).
    """
    DAYS_OF_WEEK = (
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    )
    
    ACTIVITY_LEVELS = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Very High', 'Very High'),
    )
    
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='engagement_patterns'
    )
    week_start_date = models.DateField(db_index=True)
    day_of_week = models.CharField(max_length=10, choices=DAYS_OF_WEEK)
    activity_level = models.CharField(max_length=10, choices=ACTIVITY_LEVELS, default='Low')
    total_views = models.PositiveIntegerField(default=0)
    total_inquiries = models.PositiveIntegerField(default=0)
    
    class Meta:
        app_label = 'properties'
        ordering = ['week_start_date', 'day_of_week']
        unique_together = ['agent', 'week_start_date', 'day_of_week']
        indexes = [
            models.Index(fields=['agent', '-week_start_date']),
        ]
    
    def __str__(self):
        return f"{self.agent.username} - {self.day_of_week} (Week of {self.week_start_date})"
    
    def calculate_activity_level(self):
        """Calculate activity level based on views and inquiries"""
        total_activity = self.total_views + (self.total_inquiries * 10)
        
        if total_activity >= 100:
            self.activity_level = 'Very High'
        elif total_activity >= 50:
            self.activity_level = 'High'
        elif total_activity >= 20:
            self.activity_level = 'Medium'
        else:
            self.activity_level = 'Low'
        
        self.save(update_fields=['activity_level'])
