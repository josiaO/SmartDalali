import { useQuery } from '@tanstack/react-query';
import { fetchSubscriptionPlans } from '@/api/payments';
import { FEATURES } from '@/lib/constants';
import { useUI } from '@/contexts/UIContext';

export function usePayments() {
    const { showPaymentsDisabled } = useUI();

    // Fetch subscription plans (returns mock data if disabled)
    const {
        data: plans = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: fetchSubscriptionPlans,
    });

    /**
     * Attempt to initiate payment (will show disabled message)
     */
    const initiatePayment = async (planId: number, phoneNumber: string) => {
        if (!FEATURES.PAYMENTS_ENABLED) {
            showPaymentsDisabled();
            return null;
        }
        // This won't be reached in launch mode
        return null;
    };

    return {
        plans,
        isLoading,
        error,
        initiatePayment,
        isPaymentsEnabled: FEATURES.PAYMENTS_ENABLED,
    };
}
