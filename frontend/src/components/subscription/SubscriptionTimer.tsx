import React from 'react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SubscriptionTimerProps {
    /** Show compact version */
    compact?: boolean;
}

/**
 * Countdown timer component for subscription expiry
 * Shows days remaining with color-coded visual indicator
 */
export function SubscriptionTimer({ compact = false }: SubscriptionTimerProps) {
    const { t } = useTranslation();
    const { subscription, daysRemaining, isExpired, isTrial, loading } = useUserSubscription();

    if (loading || !subscription || !isTrial) {
        return null;
    }

    // Calculate progress percentage (inverse - more days = fuller bar)
    const totalDays = subscription.plan.duration_days;
    const progressPercentage = Math.max(0, ((totalDays - daysRemaining) / totalDays) * 100);

    // Determine color based on days remaining
    const getStatusColor = () => {
        if (isExpired) return 'text-red-600 dark:text-red-400';
        if (daysRemaining <= 3) return 'text-red-600 dark:text-red-400';
        if (daysRemaining <= 7) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-green-600 dark:text-green-400';
    };

    const getProgressColor = () => {
        if (isExpired || daysRemaining <= 3) return 'bg-red-500';
        if (daysRemaining <= 7) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (compact) {
        return (
            <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link to="/dashboard/pricing">
                    <Clock className={`h-4 w-4 ${getStatusColor()}`} />
                    <span className="text-sm">
                        {isExpired ? t('subscription.trial_expired') : t('subscription.days_left', { count: daysRemaining })}
                    </span>
                </Link>
            </Button>
        );
    }

    return (
        <Card className="border-primary/20">
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            {isExpired ? (
                                <AlertCircle className={`h-5 w-5 ${getStatusColor()}`} />
                            ) : (
                                <Clock className={`h-5 w-5 ${getStatusColor()}`} />
                            )}
                            <div>
                                <h3 className="font-semibold">
                                    {isExpired ? t('subscription.free_trial_expired') : t('subscription.free_trial_active')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {isExpired
                                        ? t('subscription.upgrade_to_continue')
                                        : t('subscription.trial_ends_in', { count: daysRemaining })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {!isExpired && (
                        <div className="space-y-2">
                            <Progress value={progressPercentage} className="h-2">
                                <div
                                    className={`h-full transition-all ${getProgressColor()}`}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </Progress>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{t('subscription.started_days_ago', { count: totalDays - daysRemaining })}</span>
                                <span>{t('subscription.days_remaining', { count: daysRemaining })}</span>
                            </div>
                        </div>
                    )}

                    <Button className="w-full" asChild>
                        <Link to="/dashboard/pricing">
                            {isExpired ? t('subscription.upgrade_now') : t('subscription.view_upgrade_options')}
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
