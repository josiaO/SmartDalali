import React, { ReactNode } from 'react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureGateProps {
    /** Feature code to check access for */
    feature: string;
    /** Content to render if user has access */
    children: ReactNode;
    /** Custom fallback content when access is denied */
    fallback?: ReactNode;
    /** Show upgrade card instead of simple message */
    showUpgrade?: boolean;
    /** Custom message for when feature is disabled */
    disabledMessage?: string;
}

/**
 * FeatureGate - Wrapper component for feature-based access control
 * 
 * Renders children if user has access to the feature,
 * otherwise shows appropriate messaging based on feature status
 */
export function FeatureGate({
    feature,
    children,
    fallback,
    showUpgrade = true,
    disabledMessage,
}: FeatureGateProps) {
    const { hasFeature, loading, availableFeatures, subscription } = useUserSubscription();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Check global feature status first
    const featureData = availableFeatures.find(f => f.code === feature);

    // If feature is globally disabled, block access for everyone
    if (featureData && featureData.status === 'disabled') {
        if (fallback) return <>{fallback}</>;

        if (disabledMessage) {
            return (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Feature Unavailable</AlertTitle>
                    <AlertDescription>{disabledMessage}</AlertDescription>
                </Alert>
            );
        }
        return null;
    }

    // If feature is coming soon, show coming soon message
    if (featureData && featureData.status === 'coming_soon') {
        return (
            <div className="relative">
                <div className="blur-sm pointer-events-none select-none opacity-50">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-6 max-w-md shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            <h3 className="font-semibold text-lg">Coming Soon</h3>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            {featureData.description || 'This feature is currently under development and will be available soon.'}
                        </p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link to="/dashboard/pricing">View Plans</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Check if user has access to this feature (either via subscription or it's global)
    // Note: hasFeature already checks subscription status, but we need to handle global features explicitly if they aren't in the plan
    const isGlobalActive = featureData?.is_global && featureData?.status === 'active';
    const userHasAccess = hasFeature(feature) || isGlobalActive;

    if (userHasAccess) {
        return <>{children}</>;
    }

    // Feature is active but user doesn't have access - show upgrade prompt
    if (showUpgrade) {
        return (
            <div className="relative">
                <div className="blur-sm pointer-events-none select-none opacity-30">
                    {children}
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-6 max-w-md shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold text-lg">Upgrade Required</h3>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            {featureData.description || `Access to ${featureData.name} requires an upgraded subscription plan.`}
                        </p>
                        <div className="flex gap-2">
                            <Button className="flex-1" asChild>
                                <Link to="/dashboard/pricing">Upgrade Now</Link>
                            </Button>
                            <Button variant="outline" className="flex-1" asChild>
                                <Link to="/dashboard/pricing">View Plans</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Simple locked message without upgrade prompt
    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Upgrade Required</AlertTitle>
            <AlertDescription>
                This feature requires an upgraded subscription.{' '}
                <Link to="/dashboard/pricing" className="underline">
                    View plans
                </Link>
            </AlertDescription>
        </Alert>
    );
}
