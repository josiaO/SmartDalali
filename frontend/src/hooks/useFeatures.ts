import { useQuery } from '@tanstack/react-query';
import { getFeatures, Feature } from '@/api/features';

export function useFeatures() {
    const { data: features = [], isLoading } = useQuery({
        queryKey: ['features'],
        queryFn: getFeatures,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const isEnabled = (code: string) => {
        const feature = features.find((f) => f.code === code);
        return feature?.status === 'active';
    };

    // Helper to check if a feature exists at all (even if coming soon)
    const getFeature = (code: string) => features.find((f) => f.code === code);

    return {
        features,
        isLoading,
        isEnabled,
        getFeature
    };
}
