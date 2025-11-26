import { Card, CardContent } from '@/components/ui/card';
import { ComingSoonButton } from '@/components/common/ComingSoon';
import { Rocket } from 'lucide-react';

export default function ComingSoon() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
            This feature is under development and will be available soon. Stay tuned for updates!
          </p>
          <ComingSoonButton>
            Get Notified When Available
          </ComingSoonButton>
        </CardContent>
      </Card>
    </div>
  );
}
