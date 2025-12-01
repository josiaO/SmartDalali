from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import SupportTicketViewSet, TicketMessageViewSet, TicketAttachmentViewSet

router = DefaultRouter()
router.register(r'tickets', SupportTicketViewSet, basename='support-tickets')

# Nested router for messages
tickets_router = routers.NestedDefaultRouter(router, r'tickets', lookup='ticket')
tickets_router.register(r'messages', TicketMessageViewSet, basename='ticket-messages')

# Nested router for attachments
messages_router = routers.NestedDefaultRouter(tickets_router, r'messages', lookup='message')
messages_router.register(r'attachments', TicketAttachmentViewSet, basename='message-attachments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(tickets_router.urls)),
    path('', include(messages_router.urls)),
]
