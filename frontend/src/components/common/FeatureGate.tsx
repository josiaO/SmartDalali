import { ReactNode } from 'react';
import { useFeatures } from '@/hooks/useFeatures';

interface FeatureGateProps {
    feature: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
    const { isEnabled, isLoading } = useFeatures();

    if (isLoading) {
        return null;
    }

    if (isEnabled(feature)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
