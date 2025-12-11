import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Subscription() {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent' || user?.role === 'admin';

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center">
      <Card className="w-full max-w-2xl text-center border-primary/20 shadow-2xl">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <ShieldCheck className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold mb-2">SmartDalali v1 Early Access</CardTitle>
          <CardDescription className="text-lg">
            We are currently in our early access period. All features are completely free for our early adopters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="bg-muted/30 p-6 rounded-xl text-left border">
            <h3 className="font-semibold mb-4 text-lg">What you get for free:</h3>
            <ul className="space-y-3">
              {[
                'Unlimited Property Listings',
                'Verified Agent Badge',
                'Direct In-App Messaging',
                'Analytics Dashboard',
                'Priority Support'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAgent ? (
              <Link to="/become-agent">
                <Button size="lg" className="w-full sm:w-auto">
                  Become an Agent - It's Free
                </Button>
              </Link>
            ) : (
              <Link to="/properties/create">
                <Button size="lg" className="w-full sm:w-auto">
                  List a New Property
                </Button>
              </Link>
            )}

            <Link to="/">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            * Future premium features may be introduced, but early adopters will receive special perks.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
