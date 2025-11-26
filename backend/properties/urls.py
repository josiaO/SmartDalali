from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyVisitListCreateView, PropertyVisitRetrieveUpdateDestroyView,
    PropertyListCreateView, PropertyRetrieveUpdateDestroyView,
    PaymentViewSet, SupportTicketViewSet, stk_push, mpesa_callback,
    payment_status, geocode_property_location, agent_stats,
    FeatureViewSet, SubscriptionPlanViewSet, AgentRatingViewSet,
    toggle_property_like, track_property_view
)
from .agent_profile_view import agent_public_profile
from .analytics import admin_stats, user_growth, property_stats

# Separate routers to avoid conflicts
payment_router = DefaultRouter()
payment_router.register(r'', PaymentViewSet, basename='payment')

support_router = DefaultRouter()
support_router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')

# Feature router - matches frontend expectations
# Frontend calls: /api/v1/properties/features/ and /api/v1/properties/features/plans/
feature_router = DefaultRouter()
feature_router.register(r'plans', SubscriptionPlanViewSet, basename='subscription-plan')
feature_router.register(r'', FeatureViewSet, basename='feature')

# Ratings router
ratings_router = DefaultRouter()
ratings_router.register(r'', AgentRatingViewSet, basename='agent-rating')

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('<int:pk>/', PropertyRetrieveUpdateDestroyView.as_view(), name='property-retrieve-update-destroy'),

    path('visits/', PropertyVisitListCreateView.as_view(), name='propertyvisit-list-create'),
    path('visits/<int:pk>/', PropertyVisitRetrieveUpdateDestroyView.as_view(), name='propertyvisit-retrieve-update-destroy'),
    
    path('agent-stats/', agent_stats, name='agent_stats'),

    # Payment endpoints - specific routes first, then router
    path('payments/mpesa/stk/<int:property_id>/', stk_push, name='stk_push'),
    path('payments/mpesa/callback/', mpesa_callback, name='mpesa_callback'),
    path('payments/status/<int:payment_id>/', payment_status, name='payment_status'),
    path('payments/', include(payment_router.urls)),
    path('geocode/', geocode_property_location, name='property_geocode'),
    
    # Support endpoints
    path('support/', include(support_router.urls)),
    
    # Feature & Subscription endpoints
    # Changed from 'admin/' to 'features/' to match frontend
    path('features/', include(feature_router.urls)),
    
    
    # Agent ratings endpoints
    path('ratings/', include(ratings_router.urls)),
    
    # Agent public profile - must be before property detail to avoid conflict
    path('agents/<int:agent_id>/public-profile/', agent_public_profile, name='agent_public_profile'),
    
    # Analytics endpoints (admin only)
    path('analytics/admin-stats/', admin_stats, name='admin_stats'),
    path('analytics/user-growth/', user_growth, name='user_growth'),
    path('analytics/property-stats/', property_stats, name='property_stats'),
    
    # Property interactions
    path('<int:property_id>/like/', toggle_property_like, name='toggle_property_like'),
    path('<int:property_id>/track-view/', track_property_view, name='track_property_view'),
]