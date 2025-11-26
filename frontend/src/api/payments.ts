import api from '@/lib/axios';

export interface Payment {
  id: number;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  mpesa_receipt_number?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
}

export async function fetchPayments(): Promise<Payment[]> {
  const res = await api.get('/api/v1/properties/payments/');
  return res.data;
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await api.get('/api/v1/properties/payments/subscription/');
  return res.data;
}

export async function initiateMpesaPayment(propertyId: number, phoneNumber: string) {
  const res = await api.post(`/api/v1/properties/payments/mpesa/stk/${propertyId}/`, {
    phone_number: phoneNumber
  });
  return res.data;
}

export async function checkPaymentStatus(paymentId: number) {
  const res = await api.get(`/api/v1/properties/payments/status/${paymentId}/`);
  return res.data;
}
