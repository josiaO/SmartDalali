import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchPayments, fetchSubscriptionPlans, initiateMpesaPayment } from '@/api/payments';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  });
}

export function useInitiateMpesaPayment() {
  return useMutation({
    mutationFn: ({ propertyId, phoneNumber }: { propertyId: number; phoneNumber: string }) =>
      initiateMpesaPayment(propertyId, phoneNumber),
  });
}
