import { useState, useEffect, useCallback } from 'react';
import { fetchPlans, createPlan, updatePlan, deletePlan, SubscriptionPlan } from '@/api/admin';
import { useToast } from './use-toast';

interface UsePlansReturn {
    plans: SubscriptionPlan[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    create: (data: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan | null>;
    update: (id: number, data: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan | null>;
    remove: (id: number) => Promise<boolean>;
}

/**
 * Custom hook for managing subscription plans with CRUD operations
 * Provides automatic data fetching, loading states, and error handling
 */
export function usePlans(): UsePlansReturn {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchPlans();
            setPlans(data);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch plans';
            setError(errorMsg);
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const create = useCallback(async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> => {
        try {
            const newPlan = await createPlan(data);
            setPlans(prev => [...prev, newPlan]);
            toast({
                title: 'Success',
                description: 'Plan created successfully',
            });
            return newPlan;
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create plan';
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            });
            console.error('Error creating plan:', err);
            return null;
        }
    }, [toast]);

    const update = useCallback(async (id: number, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> => {
        try {
            const updatedPlan = await updatePlan(id, data);
            setPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
            toast({
                title: 'Success',
                description: 'Plan updated successfully',
            });
            return updatedPlan;
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to update plan';
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            });
            console.error('Error updating plan:', err);
            return null;
        }
    }, [toast]);

    const remove = useCallback(async (id: number): Promise<boolean> => {
        try {
            await deletePlan(id);
            setPlans(prev => prev.filter(p => p.id !== id));
            toast({
                title: 'Success',
                description: 'Plan deleted successfully',
            });
            return true;
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete plan';
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            });
            console.error('Error deleting plan:', err);
            return false;
        }
    }, [toast]);

    return {
        plans,
        loading,
        error,
        refetch,
        create,
        update,
        remove,
    };
}
