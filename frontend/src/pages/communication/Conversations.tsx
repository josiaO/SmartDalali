import { UserLayout } from '@/layouts/UserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useUI } from '@/contexts/UIContext';

export function Conversations() {
    const { showMessagingDisabled } = useUI();

    return (
        <UserLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Messages</h1>
                    <p className="text-muted-foreground">
                        Chat with property agents
                    </p>
                </div>

                <Card className="border-2 border-dashed">
                    <CardContent className="pt-6 text-center py-16">
                        <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Messaging Coming Soon</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Real-time messaging with property agents will be available in an upcoming update.
                            For now, you can contact agents via email or phone from the property details page.
                        </p>
                        <Button onClick={showMessagingDisabled} variant="outline">
                            Learn More
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </UserLayout>
    );
}
