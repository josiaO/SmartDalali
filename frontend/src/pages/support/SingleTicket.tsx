import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SingleTicket() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/support')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tickets
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Ticket #1234</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created on Jan 1, 2024
              </p>
            </div>
            <Badge>Open</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Subject</h3>
              <p className="text-muted-foreground">Sample ticket subject</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                This is a sample ticket description. The actual ticket system will be available soon.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground py-8">
              No responses yet
            </p>
            
            <div className="border-t pt-4">
              <Textarea
                placeholder="Type your response..."
                rows={4}
                disabled
              />
              <Button className="mt-4" disabled>
                Send Response
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
