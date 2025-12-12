"""
Analytics service layer for agent dashboard metrics calculations.
"""
from datetime import datetime, timedelta
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from django.contrib.auth import get_user_model
from collections import defaultdict

from properties.models import Property, PropertyVisit, PropertyLike
from properties.analytics_models import (
    PropertyViewEvent, PropertyEngagement, AgentLeadMetrics, 
    GeographicInsight, WeeklyEngagementPattern
)
from communications.models import Message, Conversation

User = get_user_model()


class AgentAnalyticsService:
    """
    Service for calculating agent dashboard analytics.
    """
    
    def __init__(self, agent_id):
        self.agent_id = agent_id
        try:
            self.agent = User.objects.get(id=agent_id)
        except User.DoesNotExist:
            raise ValueError(f"Agent with id {agent_id} not found")
    
    def get_listing_overview(self, days=30):
        """
        Get overview metrics for agent's listings.
        
        Returns:
            dict: Contains total_listings, active, inactive, views, inquiries
        """
        agent_properties = Property.objects.filter(owner=self.agent)
        
        # Calculate date range
        end_date = timezone.now()
        start_date_7d = end_date - timedelta(days=7)
        start_date_30d = end_date - timedelta(days=30)
        
        # Total listings
        total_listings = agent_properties.count()
        
        # Active vs inactive
        active_listings = agent_properties.filter(is_published=True, archived_at__isnull=True).count()
        inactive_listings = total_listings - active_listings
        
        # Views (use view_count from Property model)
        total_views = agent_properties.aggregate(total=Sum('view_count'))['total'] or 0
        
        # Views from events (7-day and 30-day)
        views_7d = PropertyViewEvent.objects.filter(
            property__owner=self.agent,
            viewed_at__gte=start_date_7d
        ).count()
        
        views_30d = PropertyViewEvent.objects.filter(
            property__owner=self.agent,
            viewed_at__gte=start_date_30d
        ).count()
        
        # Inquiries (PropertyVisit represents inquiries)
        total_inquiries = PropertyVisit.objects.filter(property__owner=self.agent).count()
        
        inquiries_7d = PropertyVisit.objects.filter(
            property__owner=self.agent,
            created_at__gte=start_date_7d
        ).count()
        
        inquiries_30d = PropertyVisit.objects.filter(
            property__owner=self.agent,
            created_at__gte=start_date_30d
        ).count()
        
        return {
            'total_listings': total_listings,
            'active_listings': active_listings,
            'inactive_listings': inactive_listings,
            'total_views': total_views,
            'views_7d': views_7d,
            'views_30d': views_30d,
            'total_inquiries': total_inquiries,
            'inquiries_7d': inquiries_7d,
            'inquiries_30d': inquiries_30d,
        }
    
    def get_property_performance(self, property_id=None, days=30):
        """
        Get detailed performance metrics for properties.
        
        Args:
            property_id: Optional specific property ID, otherwise all agent's properties
            days: Number of days to analyze
        
        Returns:
            list: Property performance data
        """
        agent_properties = Property.objects.filter(owner=self.agent)
        
        if property_id:
            agent_properties = agent_properties.filter(id=property_id)
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        performance_data = []
        
        for prop in agent_properties:
            # Views over time (daily breakdown)
            views_by_day = PropertyViewEvent.objects.filter(
                property=prop,
                viewed_at__gte=start_date
            ).extra(
                select={'day': 'DATE(viewed_at)'}
            ).values('day').annotate(
                count=Count('id')
            ).order_by('day')
            
            views_over_time = [
                {'date': item['day'].isoformat(), 'views': item['count']}
                for item in views_by_day
            ]
            
            # Device breakdown
            device_breakdown = PropertyViewEvent.objects.filter(
                property=prop,
                viewed_at__gte=start_date
            ).values('device_type').annotate(count=Count('id'))
            
            device_data = {item['device_type']: item['count'] for item in device_breakdown}
            
            # Engagement metrics
            engagement = PropertyEngagement.objects.filter(property=prop).first()
            
            # Likes count
            likes_count = PropertyLike.objects.filter(property=prop).count()
            
            # Contact attempts (PropertyVisit)
            contact_attempts = PropertyVisit.objects.filter(property=prop).count()
            
            # Top traffic days (days with most views)
            top_days = PropertyViewEvent.objects.filter(
                property=prop,
                viewed_at__gte=start_date
            ).extra(
                select={'day_name': "strftime('%%w', viewed_at)"}
            ).values('day_name').annotate(
                count=Count('id')
            ).order_by('-count')[:3]
            
            day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            top_traffic_days = [day_names[int(item['day_name'])] for item in top_days if item['day_name']]
            
            performance_data.append({
                'property_id': prop.id,
                'title': prop.title,
                'views_over_time': views_over_time,
                'total_views': prop.view_count,
                'likes': likes_count,
                'shares': engagement.total_shares if engagement else 0,
                'contact_attempts': contact_attempts,
                'top_traffic_days': top_traffic_days,
                'device_breakdown': {
                    'mobile': device_data.get('mobile', 0),
                    'desktop': device_data.get('desktop', 0),
                    'tablet': device_data.get('tablet', 0),
                }
            })
        
        return performance_data
    
    def get_lead_insights(self, days=30):
        """
        Get lead and buyer behavior analytics.
        
        Returns:
            dict: Lead insights data
        """
        end_date = timezone.now()
        start_date_7d = end_date - timedelta(days=7)
        start_date_30d = end_date - timedelta(days=30)
        
        # Get conversations where agent is involved
        agent_conversations = Conversation.objects.filter(agent=self.agent)
        
        # New messages (7-day and 30-day)
        new_messages_7d = Message.objects.filter(
            conversation__agent=self.agent,
            created_at__gte=start_date_7d
        ).exclude(sender=self.agent).count()
        
        new_messages_30d = Message.objects.filter(
            conversation__agent=self.agent,
            created_at__gte=start_date_30d
        ).exclude(sender=self.agent).count()
        
        # Conversations started
        conversations_started = agent_conversations.filter(
            created_at__gte=start_date_30d
        ).count()
        
        # Calculate average response time
        agent_responses = Message.objects.filter(
            conversation__agent=self.agent,
            sender=self.agent,
            created_at__gte=start_date_30d
        ).select_related('conversation')
        
        total_response_time = 0
        response_count = 0
        
        for response in agent_responses:
            # Find the previous message in the conversation
            prev_message = Message.objects.filter(
                conversation=response.conversation,
                created_at__lt=response.created_at
            ).exclude(sender=self.agent).order_by('-created_at').first()
            
            if prev_message:
                time_diff = response.created_at - prev_message.created_at
                total_response_time += time_diff.total_seconds()
                response_count += 1
        
        avg_response_time = total_response_time / response_count if response_count > 0 else 0
        avg_response_time_str = self._format_response_time(avg_response_time)
        
        # Most inquired property
        most_inquired = PropertyVisit.objects.filter(
            property__owner=self.agent
        ).values('property__id', 'property__title').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        return {
            'new_messages_7d': new_messages_7d,
            'new_messages_30d': new_messages_30d,
            'conversations_started': conversations_started,
            'avg_response_time': avg_response_time_str,
            'avg_response_time_seconds': int(avg_response_time),
            'most_inquired_property': {
                'id': most_inquired['property__id'],
                'title': most_inquired['property__title'],
                'count': most_inquired['count']
            } if most_inquired else None
        }
    
    def get_geographic_insights(self, days=30):
        """
        Get location-based analytics.
        
        Returns:
            dict: Geographic insights
        """
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Top locations by property views
        top_view_locations = PropertyViewEvent.objects.filter(
            property__owner=self.agent,
            viewed_at__gte=start_date,
            location_city__isnull=False
        ).values('location_city').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Top locations where agent's properties are located
        top_property_locations = Property.objects.filter(
            owner=self.agent,
            is_published=True
        ).values('city').annotate(
            view_count=Sum('view_count')
        ).order_by('-view_count')[:10]
        
        return {
            'top_search_locations': [
                {'location': item['location_city'], 'count': item['count']}
                for item in top_view_locations
            ],
            'top_view_locations': [
                {'location': item['city'], 'count': item['view_count'] or 0}
                for item in top_property_locations
            ]
        }
    
    def get_engagement_heatmap(self):
        """
        Get weekly engagement pattern heatmap.
        
        Returns:
            dict: Heatmap data
        """
        # Get current week start (Monday)
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        
        # Get or calculate this week's patterns
        patterns = WeeklyEngagementPattern.objects.filter(
            agent=self.agent,
            week_start_date=week_start
        ).order_by('day_of_week')
        
        # If no patterns exist, calculate them
        if not patterns.exists():
            self._calculate_weekly_patterns(week_start)
            patterns = WeeklyEngagementPattern.objects.filter(
                agent=self.agent,
                week_start_date=week_start
            ).order_by('day_of_week')
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        heatmap_data = []
        
        for day in days:
            pattern = patterns.filter(day_of_week=day).first()
            heatmap_data.append({
                'day': day,
                'level': pattern.activity_level if pattern else 'Low'
            })
        
        return {'days': heatmap_data}
    
    def get_optimization_suggestions(self):
        """
        Generate optimization suggestions for agent's listings.
        
        Returns:
            list: Suggestions
        """
        suggestions = []
        agent_properties = Property.objects.filter(owner=self.agent, is_published=True)
        
        for prop in agent_properties:
            # Check for low-quality images (no images or only 1 image)
            media_count = prop.MediaProperty.count()
            if media_count == 0:
                suggestions.append({
                    'property_id': prop.id,
                    'property_title': prop.title,
                    'type': 'images',
                    'message': f'"{prop.title}" has no images. Properties with images get 5× more views.'
                })
            elif media_count == 1:
                suggestions.append({
                    'property_id': prop.id,
                    'property_title': prop.title,
                    'type': 'images',
                    'message': f'Add more images to "{prop.title}". Properties with 5+ images get 2× more inquiries.'
                })
            
            # Check for no video
            has_video = prop.MediaProperty.filter(videos__isnull=False).exists()
            if not has_video and media_count > 0:
                suggestions.append({
                    'property_id': prop.id,
                    'property_title': prop.title,
                    'type': 'video',
                    'message': f'Add a video to "{prop.title}". Properties with videos receive 40% more inquiries.'
                })
            
            # Check for low view count
            if prop.view_count < 10:
                suggestions.append({
                    'property_id': prop.id,
                    'property_title': prop.title,
                    'type': 'visibility',
                    'message': f'"{prop.title}" has low visibility. Consider updating the description or price.'
                })
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def get_quick_wins(self):
        """
        Get actionable quick-win items.
        
        Returns:
            list: Quick win items
        """
        quick_wins = []
        
        # Properties needing more images
        properties_need_images = Property.objects.filter(
            owner=self.agent,
            is_published=True
        ).annotate(
            media_count=Count('MediaProperty')
        ).filter(media_count__lt=3)
        
        if properties_need_images.exists():
            quick_wins.append({
                'action': 'add_images',
                'title': f'Add more images to {properties_need_images.count()} properties',
                'count': properties_need_images.count(),
                'link': '/agent/my-properties'
            })
        
        # Pending conversations
        from communications.models import Message
        pending_messages = Message.objects.filter(
            conversation__agent=self.agent,
            read_at__isnull=True
        ).exclude(sender=self.agent).count()
        
        if pending_messages > 0:
            quick_wins.append({
                'action': 'respond_messages',
                'title': f'Respond to {pending_messages} pending messages',
                'count': pending_messages,
                'link': '/communication'
            })
        
        # Properties with high views but low inquiries (potential price issue)
        high_view_low_inquiry = Property.objects.filter(
            owner=self.agent,
            is_published=True,
            view_count__gte=20
        ).annotate(
            inquiry_count=Count('visits')
        ).filter(inquiry_count__lt=3)
        
        if high_view_low_inquiry.exists():
            for prop in high_view_low_inquiry[:2]:
                quick_wins.append({
                    'action': 'update_price',
                    'title': f'Consider adjusting price for "{prop.title}"',
                    'property_id': prop.id,
                    'link': f'/properties/{prop.id}/edit'
                })
        
        return quick_wins
    
    def _format_response_time(self, seconds):
        """Format response time in human-readable format"""
        if seconds < 60:
            return f"{int(seconds)} seconds"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''}"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''}"
        else:
            days = int(seconds / 86400)
            return f"{days} day{'s' if days != 1 else ''}"
    
    def _calculate_weekly_patterns(self, week_start):
        """Calculate weekly engagement patterns for the agent"""
        week_end = week_start + timedelta(days=7)
        
        days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        
        for i, day_name in enumerate(days_of_week):
            day_date = week_start + timedelta(days=i)
            next_day = day_date + timedelta(days=1)
            
            # Count views for this day
            views = PropertyViewEvent.objects.filter(
                property__owner=self.agent,
                viewed_at__gte=day_date,
                viewed_at__lt=next_day
            ).count()
            
            # Count inquiries for this day
            inquiries = PropertyVisit.objects.filter(
                property__owner=self.agent,
                created_at__gte=day_date,
                created_at__lt=next_day
            ).count()
            
            # Create or update pattern
            pattern, created = WeeklyEngagementPattern.objects.get_or_create(
                agent=self.agent,
                week_start_date=week_start,
                day_of_week=day_name,
                defaults={
                    'total_views': views,
                    'total_inquiries': inquiries
                }
            )
            
            if not created:
                pattern.total_views = views
                pattern.total_inquiries = inquiries
                pattern.save()
            
            # Calculate activity level
            pattern.calculate_activity_level()
