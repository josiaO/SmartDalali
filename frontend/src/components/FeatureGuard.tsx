import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';

interface FeatureGuardProps {
    feature: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export default function FeatureGuard({ feature, children, fallback = null }: FeatureGuardProps) {
    const { hasFeature } = useAuth();

    if (hasFeature(feature)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
