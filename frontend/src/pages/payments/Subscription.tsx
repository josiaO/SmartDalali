import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { fetchSubscriptionPlans as fetchPlans, type SubscriptionPlan } from '@/api/subscriptions';
import { useToast } from '@/hooks/use-toast';

export default function Subscription() {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await fetchPlans();
        const results = Array.isArray(data) ? data : (data as any).results || [];
        setPlans(results);
      } catch (error) {
        console.error('Failed to load plans:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription</h1>
        <p className="text-muted-foreground">
          Choose the perfect plan for your needs
        </p>
      </div>

      {!isAgent && (
        <Card className="mb-8 border-accent">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-6">
              Agent subscription is required to list properties. Please contact support to upgrade your account.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.name.toLowerCase().includes('annual') ? 'border-primary shadow-card-lg' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                {plan.name.toLowerCase().includes('annual') && (
                  <Badge variant="default">Best Value</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">TZS {Number(plan.price).toLocaleString()}</span>
                <span className="text-muted-foreground ml-2">/ {plan.duration_days} days</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.id} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.name}</span>
                  </li>
                ))}
                {plan.features.length === 0 && (
                  <li className="text-sm text-muted-foreground italic">No specific features listed</li>
                )}
              </ul>
              <Button
                className="w-full"
                onClick={() => {
                  toast({
                    title: 'Success',
                    description: 'Subscription request sent! An admin will review it shortly.',
                  });
                }}
              >
                Subscribe via M-Pesa
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payments Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're integrating M-Pesa STK Push for seamless payments. Soon you'll be able to:
            </p>
          </div>

          <div className="space-y-3 text-left max-w-md mx-auto mb-6">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                Subscribe to agent plans directly
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                Pay securely via M-Pesa
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                Automatic subscription renewal
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                View payment history and invoices
              </p>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            Get Notified When Available
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
