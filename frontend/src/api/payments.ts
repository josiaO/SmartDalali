import api from '@/lib/api';
import { API_ENDPOINTS, FEATURES } from '@/lib/constants';

export interface SubscriptionPlan {
    id: number;
    name: string;
    price: number;
    duration_days: number;
    features: string[];
}

export interface Subscription {
    id: number;
    plan: SubscriptionPlan;
    user: number;
    start_date: string;
    end_date: string;
    is_active: boolean;
    payment_method: string;
}

export interface PaymentInitiationData {
    plan_id: number;
    phone_number: string;
}

/**
 * Fetch available subscription plans (DISABLED IN LAUNCH MODE)
 * Returns mock data if payments are disabled
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    if (!FEATURES.PAYMENTS_ENABLED) {
        // Return mock data for disabled feature
        return [
            {
                id: 1,
                name: 'Basic',
                price: 999,
                duration_days: 30,
                features: ['List up to 5 properties', 'Basic analytics', 'Email support'],
            },
            {
                id: 2,
                name: 'Professional',
                price: 2999,
                duration_days: 30,
                features: [
                    'List up to 20 properties',
                    'Advanced analytics',
                    'Priority support',
                    'Featured listings',
                ],
            },
            {
                id: 3,
                name: 'Enterprise',
                price: 9999,
                duration_days: 30,
                features: [
                    'Unlimited properties',
                    'Custom analytics',
                    '24/7 dedicated support',
                    'API access',
                    'White-label option',
                ],
            },
        ];
    }

    const response = await api.get(API_ENDPOINTS.PAYMENTS.SUBSCRIPTION);
    return response.data;
}

/**
 * Initiate M-Pesa payment (DISABLED IN LAUNCH MODE)
 * Throws error if payments are disabled
 */
export async function initiatePayment(data: PaymentInitiationData): Promise<any> {
    if (!FEATURES.PAYMENTS_ENABLED) {
        throw new Error('Payments are currently disabled');
    }

    const response = await api.post(API_ENDPOINTS.PAYMENTS.INITIATE, data);
    return response.data;
}
