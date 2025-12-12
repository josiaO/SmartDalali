from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyVisitViewSet,
    PropertyListCreateView, PropertyRetrieveUpdateDestroyView,
    PaymentViewSet, SupportTicketViewSet, stk_push, mpesa_callback,
    payment_status, geocode_property_location, agent_stats, agent_properties,
    AgentRatingViewSet, AgentAnalyticsViewSet,
    toggle_property_like, track_property_view, liked_properties, viewed_properties,
    public_stats
)
from .agent_profile_view import agent_public_profile
from .analytics import admin_stats, user_growth, property_stats

# Separate routers to avoid conflicts
payment_router = DefaultRouter()
payment_router.register(r'', PaymentViewSet, basename='payment')

support_router = DefaultRouter()
support_router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')

# Ratings router
ratings_router = DefaultRouter()
ratings_router.register(r'', AgentRatingViewSet, basename='agent-rating')

# Visits router
visit_router = DefaultRouter()
visit_router.register(r'', PropertyVisitViewSet, basename='property-visit')

# Create an instance of the viewset for direct URL binding
analytics_viewset = AgentAnalyticsViewSet.as_view({
    'get': 'list'  # Dummy mapping, won't be used
})

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('<int:pk>/', PropertyRetrieveUpdateDestroyView.as_view(), name='property-retrieve-update-destroy'),

    # Visits handled by router
    path('visits/', include(visit_router.urls)),
    
    path('agent-stats/', agent_stats, name='agent_stats'),
    path('agent-properties/', agent_properties, name='agent_properties'),

    # Payment endpoints - specific routes first, then router
    path('payments/mpesa/stk/<int:property_id>/', stk_push, name='stk_push'),
    path('payments/mpesa/callback/', mpesa_callback, name='mpesa_callback'),
    path('payments/status/<int:payment_id>/', payment_status, name='payment_status'),
    path('payments/', include(payment_router.urls)),
    path('geocode/', geocode_property_location, name='property_geocode'),
    
    # Support endpoints
    path('support/', include(support_router.urls)),
    
    # Agent ratings endpoints
    path('ratings/', include(ratings_router.urls)),
    
    # Agent public profile - must be before property detail to avoid conflict
    path('agents/<int:agent_id>/public-profile/', agent_public_profile, name='agent_public_profile'),
    
    # Analytics endpoints
    # Admin analytics
    path('analytics/admin-stats/', admin_stats, name='admin_stats'),
    path('analytics/user-growth/', user_growth, name='user_growth'),
    path('analytics/property-stats/', property_stats, name='property-stats'),
    path('public-stats/', public_stats, name='public-stats'),
    
    # Agent analytics - direct paths for custom actions
    path('analytics/property-performance/', 
         AgentAnalyticsViewSet.as_view({'get': 'property_performance'}), 
         name='analytics-property-performance'),
    path('analytics/lead-insights/', 
         AgentAnalyticsViewSet.as_view({'get': 'lead_insights'}), 
         name='analytics-lead-insights'),
    path('analytics/geographic/', 
         AgentAnalyticsViewSet.as_view({'get': 'geographic'}), 
         name='analytics-geographic'),
    path('analytics/engagement-heatmap/', 
         AgentAnalyticsViewSet.as_view({'get': 'engagement_heatmap'}), 
         name='analytics-engagement-heatmap'),
    path('analytics/optimization-suggestions/', 
         AgentAnalyticsViewSet.as_view({'get': 'optimization_suggestions'}), 
         name='analytics-optimization-suggestions'),
    path('analytics/quick-wins/', 
         AgentAnalyticsViewSet.as_view({'get': 'quick_wins'}), 
         name='analytics-quick-wins'),
    
    # Property interactions
    path('<int:property_id>/like/', toggle_property_like, name='toggle_property_like'),
    path('<int:property_id>/track-view/', track_property_view, name='track_property_view'),
    path('liked/', liked_properties, name='liked_properties'),
    path('viewed/', viewed_properties, name='viewed_properties'),
]