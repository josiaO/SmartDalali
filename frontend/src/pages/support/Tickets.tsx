import { UserLayout } from '@/layouts/UserLayout';
import { useSupport } from '@/hooks/useSupport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '@/lib/helpers';

export function Tickets() {
    const { tickets, isLoading } = useSupport();

    return (
        <UserLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
                        <p className="text-muted-foreground">
                            Create and manage your support requests
                        </p>
                    </div>
                    <Button asChild className="gap-2">
                        <Link to="/support/create">
                            <Plus className="h-5 w-5" />
                            Create Ticket
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center py-16">
                            <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Create your first support ticket to get help
                            </p>
                            <Button asChild>
                                <Link to="/support/create">Create Ticket</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <Link key={ticket.id} to={`/support/${ticket.id}`}>
                                <Card className="hover-lift">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 flex-1">
                                                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {ticket.description}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    ticket.status === 'open'
                                                        ? 'default'
                                                        : ticket.status === 'resolved'
                                                            ? 'secondary'
                                                            : 'outline'
                                                }
                                            >
                                                {ticket.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                                            <span>Created {formatRelativeTime(ticket.created_at)}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {ticket.priority}
                                            </Badge>
                                            {ticket.replies && ticket.replies.length > 0 && (
                                                <span>{ticket.replies.length} replies</span>
                                            )}
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
