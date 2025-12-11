from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth.models import User
from properties.models import Property, Payment
from unittest.mock import patch

class PaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='user', password='password')
        self.property = Property.objects.create(
            owner=self.user, title='Prop', price=1000, 
            rooms=1, bedrooms=1, bathrooms=1, area=100, city='Nairobi'
        )
        self.client.force_authenticate(user=self.user)

    @patch('utils.mpesa_daraja.get_mpesa_service')
    def test_stk_push(self, mock_get_service):
        mock_service = mock_get_service.return_value
        mock_service.initiate_stk_push.return_value = {
            'CheckoutRequestID': 'ws_CO_12345',
            'CustomerMessage': 'Success',
            'ResponseCode': '0',
            'ResponseDescription': 'Success'
        }

        url = f'/api/v1/properties/payments/mpesa/stk/{self.property.id}/'
        data = {'phone': '254700000000', 'amount': 100}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check Payment created
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(Payment.objects.first().status, 'pending')

    @patch('utils.mpesa_daraja.get_mpesa_service')
    def test_mpesa_callback(self, mock_get_service):
        # Create pending payment
        payment = Payment.objects.create(
            user=self.user,
            property=self.property,
            method='mpesa',
            amount=100,
            transaction_id='ws_CO_12345',
            status='pending'
        )
        
        mock_service = mock_get_service.return_value
        # Mock validation
        mock_service.validate_callback_payload.return_value = True
        mock_service.extract_callback_data.return_value = {
            'CheckoutRequestID': 'ws_CO_12345',
            'ResultCode': 0,
            'ResultDesc': 'Completed',
            'MpesaReceiptNumber': 'ABC12345'
        }

        url = '/api/v1/properties/payments/mpesa/callback/'
        data = {
           'Body': {
               'stkCallback': {
                   # Structure doesn't matter much as we mock extract_callback_data
                   # but good to be realistic
                   'CheckoutRequestID': 'ws_CO_12345'
               }
           }
        }
        
        # Callback is usually POST from Safaricom
        self.client.logout() # Unauthenticated
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, 200) # JsonResponse
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'completed')
