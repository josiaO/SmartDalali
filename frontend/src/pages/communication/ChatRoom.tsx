import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComingSoonButton } from '@/components/common/ComingSoon';
import { MessageSquare } from 'lucide-react';

export default function ChatRoom() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Chat Room</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Real-time Chat Coming Soon</h2>
          <p className="text-muted-foreground mb-6">
            This feature will be available in the next release
          </p>
          <ComingSoonButton>
            Get Notified
          </ComingSoonButton>
        </CardContent>
      </Card>
    </div>
  );
}
