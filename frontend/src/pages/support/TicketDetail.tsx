import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserLayout } from '@/layouts/UserLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useSupport } from '@/hooks/useSupport';
import { useUI } from '@/contexts/UIContext';
import { ArrowLeft, Send } from 'lucide-react';
import { formatRelativeTime } from '@/lib/helpers';

export function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { useTicket, replyToTicket, isReplying } = useSupport();
    const { data: ticket, isLoading } = useTicket(id!);
    const { showSuccess, showError } = useUI();

    const [replyText, setReplyText] = useState('');

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!replyText.trim()) return;

        try {
            await replyToTicket({
                id: id!,
                data: {
                    message: replyText,
                },
            });

            setReplyText('');
            showSuccess('Reply sent successfully!');
        } catch (error: any) {
            showError(error.message || 'Failed to send reply');
        }
    };

    if (isLoading) {
        return (
            <UserLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </UserLayout>
        );
    }

    if (!ticket) {
        return (
            <UserLayout>
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold mb-4">Ticket not found</h2>
                    <Button onClick={() => navigate('/support')}>Back to Tickets</Button>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                        <p className="text-sm text-muted-foreground">
                            Created {formatRelativeTime(ticket.created_at)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <Badge variant="outline">{ticket.priority}</Badge>
                    </div>
                </div>

                {/* Original Message */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Original Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line">{ticket.description}</p>
                    </CardContent>
                </Card>

                {/* Replies */}
                {ticket.replies && ticket.replies.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Conversation</h2>
                        {ticket.replies.map((reply, index) => (
                            <Card key={index}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold">Support Team</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatRelativeTime(reply.created_at)}
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            Staff
                                        </Badge>
                                    </div>
                                    <Separator className="mb-3" />
                                    <p className="whitespace-pre-line">{reply.message}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Reply Form */}
                {ticket.status !== 'closed' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Add Reply</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleReply} className="space-y-4">
                                <Textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows={4}
                                    disabled={isReplying}
                                />
                                <Button type="submit" disabled={isReplying || !replyText.trim()} className="gap-2">
                                    <Send className="h-4 w-4" />
                                    {isReplying ? 'Sending...' : 'Send Reply'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </UserLayout>
    );
}
