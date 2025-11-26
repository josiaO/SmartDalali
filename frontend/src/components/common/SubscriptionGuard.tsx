import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { checkPermission, Feature } from '@/lib/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: ReactNode;
  feature: Feature;
  fallback?: ReactNode;
}

export function SubscriptionGuard({ children, feature, fallback }: SubscriptionGuardProps) {
  const { user } = useAuth();
  const { hasActiveSubscription, isLoading } = useSubscription();

  const permission = checkPermission(feature, user?.role, hasActiveSubscription);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!permission.allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {permission.requiresSubscription ? (
                <Lock className="h-8 w-8 text-primary" />
              ) : (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {permission.requiresSubscription 
                ? 'Subscription Required' 
                : 'Access Denied'}
            </CardTitle>
            <CardDescription className="text-base">
              {permission.reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {permission.requiresSubscription && (
              <>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    This feature requires an active agent subscription. Upgrade your account to unlock:
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-sm">Unlimited property listings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-sm">Advanced analytics and insights</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-sm">Priority customer support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary mt-1">✓</span>
                    <span className="text-sm">Featured property listings</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Link to="/payments/subscription">
                    <Button className="w-full" size="lg">
                      <Shield className="mr-2 h-4 w-4" />
                      View Subscription Plans
                    </Button>
                  </Link>
                  <Link to="/agent">
                    <Button variant="outline" className="w-full">
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {!permission.requiresSubscription && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have the required permissions to access this feature.
                </p>
                <Link to="/">
                  <Button variant="outline">
                    Go to Home
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
