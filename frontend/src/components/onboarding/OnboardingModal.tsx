import React, { useEffect, useState } from 'react';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const { subscription, daysRemaining, isTrial, availableFeatures, loading } = useUserSubscription();

    useEffect(() => {
        // Check if user has seen onboarding before
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');

        if (!hasSeenOnboarding && !loading && subscription) {
            setIsOpen(true);
        }
    }, [loading, subscription]);

    const handleClose = () => {
        localStorage.setItem('hasSeenOnboarding', 'true');
        setIsOpen(false);
    };

    if (loading || !subscription) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        <DialogTitle className="text-2xl">Welcome to SmartDalali!</DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                        We're excited to have you on board. Here's what you need to know to get started.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Current Tier */}
                    <div className="bg-muted/50 rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">Your Current Plan</h3>
                            <Badge variant="default" className="text-sm">
                                {subscription.plan.name}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {subscription.plan.name === 'Free' || isTrial
                                ? 'You\'re currently on a free trial. Upgrade anytime to unlock more features.'
                                : 'You have access to all features in this plan.'}
                        </p>
                    </div>

                    {/* Trial Countdown */}
                    {isTrial && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-900">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                    Free Trial Active
                                </h3>
                            </div>
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                Your free trial ends in{' '}
                                <span className="font-bold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>.
                                Upgrade before it expires to continue using premium features.
                            </p>
                        </div>
                    )}

                    {/* Available Features */}
                    <div>
                        <h3 className="font-semibold mb-3">Features Available to You</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableFeatures.length > 0 ? (
                                availableFeatures.map((feature) => (
                                    <div key={feature.id} className="flex items-start gap-2 text-sm">
                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{feature.name}</p>
                                            {feature.description && (
                                                <p className="text-muted-foreground text-xs">{feature.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground col-span-2">
                                    No features included in your current plan.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="flex gap-3 pt-4">
                        <Button className="flex-1" onClick={handleClose}>
                            Start Exploring
                        </Button>
                        {(isTrial || subscription.plan.name === 'Free') && (
                            <Button variant="outline" className="flex-1" asChild>
                                <Link to="/dashboard/pricing" onClick={handleClose}>
                                    View All Plans
                                </Link>
                            </Button>
                        )}
                    </div>

                    <button
                        onClick={handleClose}
                        className="text-sm text-muted-foreground hover:text-foreground text-center w-full"
                    >
                        Skip for now
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
