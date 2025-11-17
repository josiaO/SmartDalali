from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PropertyVisitListCreateView, PropertyVisitRetrieveUpdateDestroyView,
    PropertyListCreateView, PropertyRetrieveUpdateDestroyView,
    PaymentViewSet, SupportTicketViewSet, stk_push, mpesa_callback, payment_status
)

# Separate routers to avoid conflicts
payment_router = DefaultRouter()
payment_router.register(r'', PaymentViewSet, basename='payment')

support_router = DefaultRouter()
support_router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')

urlpatterns = [
    path('', PropertyListCreateView.as_view(), name='property-list-create'),
    path('<int:pk>/', PropertyRetrieveUpdateDestroyView.as_view(), name='property-retrieve-update-destroy'),

    path('visits/', PropertyVisitListCreateView.as_view(), name='propertyvisit-list-create'),
    path('visits/<int:pk>/', PropertyVisitRetrieveUpdateDestroyView.as_view(), name='propertyvisit-retrieve-update-destroy'),
    
    # Payment endpoints - specific routes first, then router
    path('payments/mpesa/stk/<int:property_id>/', stk_push, name='stk_push'),
    path('payments/mpesa/callback/', mpesa_callback, name='mpesa_callback'),
    path('payments/status/<int:payment_id>/', payment_status, name='payment_status'),
    path('payments/', include(payment_router.urls)),
    
    # Support endpoints
    path('support/', include(support_router.urls)),
]