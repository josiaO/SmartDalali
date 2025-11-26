"""
Analytics views for admin dashboard
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Avg
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from collections import defaultdict

from properties.models import Property, AgentRating, AgentProfile
from accounts.permissions import IsAdmin

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_stats(request):
    """
    Get overall platform statistics for admin dashboard
    """
    # Total users
    total_users = User.objects.count()
    
    # Total agents (users with agent profile)
    total_agents = AgentProfile.objects.count()
    
    # Total properties
    total_properties = Property.objects.count()
    
    # Published properties
    published_properties = Property.objects.filter(is_published=True).count()
    
    # Average agent rating
    avg_rating = AgentRating.objects.aggregate(Avg('rating'))['rating__avg'] or 0
    
    # Active subscriptions (agents with active subscriptions)
    # Note: Assuming you have a subscription model, adjust as needed
    active_subscriptions = 0  # Placeholder - implement based on your subscription model
    
    return Response({
        'total_users': total_users,
        'total_agents': total_agents,
        'total_properties': total_properties,
        'published_properties': published_properties,
        'active_subscriptions': active_subscriptions,
        'avg_rating': round(avg_rating, 1) if avg_rating else 0,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def user_growth(request):
    """
    Get user growth data grouped by month
    """
    # Get users from the last 12 months
    twelve_months_ago = datetime.now() - timedelta(days=365)
    users = User.objects.filter(date_joined__gte=twelve_months_ago).values('date_joined')
    
    # Group by month
    month_counts = defaultdict(int)
    for user in users:
        month_key = user['date_joined'].strftime('%b %Y')
        month_counts[month_key] += 1
    
    # Convert to list format for charts
    growth_data = [
        {'month': month, 'users': count}
        for month, count in sorted(month_counts.items(), key=lambda x: datetime.strptime(x[0], '%b %Y'))
    ]
    
    return Response(growth_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def property_stats(request):
    """
    Get property statistics by type and status
    """
    # Properties by type
    by_type = Property.objects.values('type').annotate(count=Count('id'))
    
    # Properties by status
    by_status = Property.objects.values('status').annotate(count=Count('id'))
    
    # Properties by city (top 10)
    by_city = Property.objects.values('city').annotate(count=Count('id')).order_by('-count')[:10]
    
    return Response({
        'by_type': list(by_type),
        'by_status': list(by_status),
        'by_city': list(by_city),
    })
