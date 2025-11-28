import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { Feature } from '@/api/admin';

export interface UserSubscriptionData {
    id: number;
    user: number;
    plan: {
        id: number;
        name: string;
        price_monthly?: number;
        price_yearly?: number;
        duration_days: number;
        features: Feature[];
    };
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_trial: boolean;
}

interface UseUserSubscriptionReturn {
    subscription: UserSubscriptionData | null;
    loading: boolean;
    error: string | null;
    availableFeatures: Feature[];
    hasFeature: (featureCode: string) => boolean;
    daysRemaining: number;
    isExpired: boolean;
    isTrial: boolean;
    refetch: () => Promise<void>;
}

/**
 * Custom hook for managing user subscription and feature access
 * Provides feature access checking, countdown timer, and subscription status
 */
export function useUserSubscription(): UseUserSubscriptionReturn {
    const { user, loading: authLoading } = useAuth();
    const [subscription, setSubscription] = useState<UserSubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch user's current subscription
            const response = await api.get<UserSubscriptionData>('/api/v1/subscriptions/current/');
            setSubscription(response.data);
        } catch (err: any) {
            if (err?.response?.status === 404) {
                // User has no subscription
                setSubscription(null);
            } else {
                const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch subscription';
                setError(errorMsg);
                console.error('Error fetching subscription:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            refetch();
        }
    }, [authLoading, refetch]);

    // Calculate days remaining
    const daysRemaining = subscription?.end_date
        ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    // Check if subscription is expired
    const isExpired = subscription?.end_date
        ? new Date(subscription.end_date) < new Date()
        : false;

    // Check if it's a trial subscription
    const isTrial = subscription?.is_trial || false;

    // Get available features from the subscription plan
    const availableFeatures = subscription?.plan?.features || [];

    // Check if user has access to a specific feature
    const hasFeature = useCallback(
        (featureCode: string): boolean => {
            if (!subscription || isExpired) return false;
            return availableFeatures.some(
                (feature) => feature.code === featureCode && feature.status === 'active'
            );
        },
        [subscription, availableFeatures, isExpired]
    );

    return {
        subscription,
        loading: authLoading || loading,
        error,
        availableFeatures,
        hasFeature,
        daysRemaining,
        isExpired,
        isTrial,
        refetch,
    };
}
