import { useState, useEffect, useCallback } from 'react';
import { fetchFeatures, createFeature, updateFeature, deleteFeature, Feature } from '@/api/admin';
import { useToast } from './use-toast';

interface UseFeaturesReturn {
    features: Feature[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    create: (data: Partial<Feature>) => Promise<Feature | null>;
    update: (id: number, data: Partial<Feature>) => Promise<Feature | null>;
    remove: (id: number) => Promise<boolean>;
}

/**
 * Custom hook for managing features with CRUD operations
 * Provides automatic data fetching, loading states, and error handling
 */
export function useFeatures(): UseFeaturesReturn {
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchFeatures();
            setFeatures(data);
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to fetch features';
            setError(errorMsg);
            console.error('Error fetching features:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const create = useCallback(async (data: Partial<Feature>): Promise<Feature | null> => {
        try {
            const newFeature = await createFeature(data);
            setFeatures(prev => [...prev, newFeature]);
            toast({
                title: 'Success',
                description: 'Feature created successfully',
            });
            return newFeature;
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create feature';
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            });
            console.error('Error creating feature:', err);
            return null;
        }
    }, [toast]);

    const update = useCallback(async (id: number, data: Partial<Feature>): Promise<Feature | null> => {
        try {
            const updatedFeature = await updateFeature(id, data);
            setFeatures(prev => prev.map(f => f.id === id ? updatedFeature : f));
            toast({
                title: 'Success',
                description: 'Feature updated successfully',
            });
            return updatedFeature;
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to update feature';
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            });
            console.error('Error updating feature:', err);
            return null;
        }
    }, [toast]);

    const remove = useCallback(async (id: number): Promise<boolean> => {
        try {
            await deleteFeature(id);
            setFeatures(prev => prev.filter(f => f.id !== id));
            toast({
                title: 'Success',
                description: 'Feature deleted successfully',
            });
            return true;
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || err?.message || 'Failed to delete feature';
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            });
            console.error('Error deleting feature:', err);
            return false;
        }
    }, [toast]);

    return {
        features,
        loading,
        error,
        refetch,
        create,
        update,
        remove,
    };
}
