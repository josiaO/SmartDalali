import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface UpgradeCardProps {
    currentPlan?: string;
    requiredPlan: {
        id: number;
        name: string;
        price_monthly?: number;
        price_yearly?: number;
        features: Array<{ id: number; name: string; description?: string }>;
    };
    feature?: string;
}

/**
 * Upsell component for restricted features
 * Shows pricing comparison and upgrade CTA
 */
export function UpgradeCard({ currentPlan, requiredPlan, feature }: UpgradeCardProps) {
    const { t } = useTranslation();
    const formatPrice = (price?: number) => {
        if (!price) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <Card className="w-full max-w-md border-primary/50 shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        {t('subscription.upgrade_required')}
                    </Badge>
                    {currentPlan && (
                        <span className="text-sm text-muted-foreground">
                            {t('subscription.current')}: <span className="font-medium">{currentPlan}</span>
                        </span>
                    )}
                </div>
                <CardTitle className="text-2xl">{requiredPlan.name}</CardTitle>
                <CardDescription>
                    {feature
                        ? t('subscription.feature_requires_plan', { feature, plan: requiredPlan.name })
                        : t('subscription.unlock_features', { plan: requiredPlan.name })}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="flex items-baseline gap-2">
                    {requiredPlan.price_monthly && (
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">{formatPrice(requiredPlan.price_monthly)}</span>
                            <span className="text-muted-foreground">/{t('subscription.month')}</span>
                        </div>
                    )}
                    {requiredPlan.price_yearly && requiredPlan.price_monthly && (
                        <span className="text-sm text-muted-foreground">
                            {t('subscription.or')} {formatPrice(requiredPlan.price_yearly)}/{t('subscription.year')}
                        </span>
                    )}
                    {!requiredPlan.price_monthly && requiredPlan.price_yearly && (
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">{formatPrice(requiredPlan.price_yearly)}</span>
                            <span className="text-muted-foreground">/{t('subscription.year')}</span>
                        </div>
                    )}
                </div>

                {/* Features List */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">{t('subscription.whats_included')}</p>
                    <ul className="space-y-2">
                        {requiredPlan.features.slice(0, 5).map((planFeature) => (
                            <li key={planFeature.id} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <span className="font-medium">{planFeature.name}</span>
                                    {planFeature.description && (
                                        <p className="text-muted-foreground text-xs">{planFeature.description}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                        {requiredPlan.features.length > 5 && (
                            <li className="text-sm text-muted-foreground pl-6">
                                {t('subscription.more_features', { count: requiredPlan.features.length - 5 })}
                            </li>
                        )}
                    </ul>
                </div>
            </CardContent>

            <CardFooter className="flex gap-2">
                <Button className="flex-1 gap-2" asChild>
                    <Link to="/dashboard/pricing">
                        {t('subscription.upgrade_now')}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                    <Link to="/dashboard/pricing">{t('subscription.compare_plans')}</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
