from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from properties.models import SupportTicket

class SupportTicketTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user', password='password')
        self.admin = User.objects.create_superuser(username='admin', password='password')
        
    def test_create_ticket(self):
        self.client.force_authenticate(user=self.user)
        # Using reverse would be better but I'm hardcoding logic for Speed based on pattern
        # router: support_router.register(r'tickets', SupportTicketViewSet, basename='support-ticket')
        # URL: /api/v1/properties/support/tickets/
        url = '/api/v1/properties/support/tickets/'
        
        data = {
            'subject': 'Help needed',
            'description': 'I have an issue',
            'category': 'technical',
            'priority': 'high'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SupportTicket.objects.count(), 1)
        self.assertEqual(SupportTicket.objects.first().user, self.user)

    def test_list_tickets(self):
        self.client.force_authenticate(user=self.user)
        SupportTicket.objects.create(
            user=self.user, 
            subject='My Ticket',
            description='Desc',
            category='account'
        )
        url = '/api/v1/properties/support/tickets/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_reply_ticket(self):
        ticket = SupportTicket.objects.create(
            user=self.user, 
            subject='My Ticket',
            description='Desc',
            category='account'
        )
        self.client.force_authenticate(user=self.admin)
        url = f'/api/v1/properties/support/tickets/{ticket.id}/reply/'
        data = {'message': 'We are looking into it'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check ticket status update logic
        ticket.refresh_from_db()
        self.assertEqual(ticket.status, 'in_progress')
