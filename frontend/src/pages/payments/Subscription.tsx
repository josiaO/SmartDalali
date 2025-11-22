import { AgentLayout } from '@/layouts/AgentLayout';
import { usePayments } from '@/hooks/usePayments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';
import { formatPrice } from '@/lib/helpers';
import { useUI } from '@/contexts/UIContext';

export function Subscription() {
    const { plans, isLoading } = usePayments();
    const { showPaymentsDisabled } = useUI();

    return (
        <AgentLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
                    <p className="text-muted-foreground">
                        Choose the perfect plan for your business
                    </p>
                    <Badge variant="secondary" className="mt-3">
                        Payments Coming Soon
                    </Badge>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`relative overflow-hidden ${plan.id === 2 ? 'border-primary border-2' : ''
                                    }`}
                            >
                                {plan.id === 2 && (
                                    <div className="absolute top-0 right-0">
                                        <Badge className="rounded-none rounded-bl-lg">Popular</Badge>
                                    </div>
                                )}

                                <CardHeader>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription>{plan.duration_days} days</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">{formatPrice(plan.price)}</span>
                                        <span className="text-muted-foreground">/month</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={showPaymentsDisabled}
                                        disabled
                                        className="w-full gap-2"
                                        variant={plan.id === 2 ? 'default' : 'outline'}
                                    >
                                        <CreditCard className="h-4 w-4" />
                                        Subscribe via M-Pesa
                                    </Button>

                                    <p className="text-xs text-center text-muted-foreground">
                                        Payment integration coming soon
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AgentLayout>
    );
}
