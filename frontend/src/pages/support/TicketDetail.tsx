import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, CheckCircle, Clock, AlertCircle, User, Shield } from 'lucide-react';
import { getSupportTicket, replyToTicket, closeTicket } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import i18n from '@/i18n';

export default function TicketDetail() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [replyMessage, setReplyMessage] = useState('');

    const { data: ticket, isLoading } = useQuery({
        queryKey: ['support-ticket', id],
        queryFn: () => getSupportTicket(id!),
        enabled: !!id,
    });

    const replyMutation = useMutation({
        mutationFn: (message: string) => replyToTicket(id!, message),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
            setReplyMessage('');
            toast({
                title: t('common.success'),
                description: t('support.reply_sent'),
            });
        },
        onError: () => {
            toast({
                title: t('common.error'),
                description: t('notifications.error_occurred'),
                variant: 'destructive',
            });
        },
    });

    const closeMutation = useMutation({
        mutationFn: () => closeTicket(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
            toast({
                title: t('common.success'),
                description: t('support.ticket_closed'),
            });
        },
    });

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;
        replyMutation.mutate(replyMessage);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-500';
            case 'in_progress': return 'bg-yellow-500';
            case 'resolved': return 'bg-green-500';
            case 'closed': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (!ticket) return <div>{t('support.ticket_not_found')}</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button variant="ghost" onClick={() => navigate('/support')} className="mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
            </Button>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content - Conversation */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{ticket.title}</CardTitle>
                                    <CardDescription className="mt-2">
                                        #{ticket.ticket_number} • {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true, locale: enUS })}
                                    </CardDescription>
                                </div>
                                <Badge className={getStatusColor(ticket.status)}>
                                    {t(`support.status_types.${ticket.status}`)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted/30 p-4 rounded-lg mb-6">
                                <p className="whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-semibold text-lg">{t('support.conversation')}</h3>

                                {ticket.replies.length === 0 ? (
                                    <p className="text-muted-foreground text-sm italic">{t('support.no_replies')}</p>
                                ) : (
                                    <div className="space-y-4">
                                        {ticket.replies.map((reply) => (
                                            <div
                                                key={reply.id}
                                                className={`flex gap-4 ${reply.is_admin_reply ? 'flex-row-reverse' : ''}`}
                                            >
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${reply.is_admin_reply ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                    {reply.is_admin_reply ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                                </div>
                                                <div className={`flex-1 max-w-[80%] rounded-lg p-4 ${reply.is_admin_reply ? 'bg-primary/10' : 'bg-muted'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-semibold text-sm">
                                                            {reply.is_admin_reply ? t('support.support_team') : reply.user_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true, locale: enUS })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        {ticket.status !== 'closed' && (
                            <CardFooter className="block pt-6">
                                <form onSubmit={handleReply} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reply">{t('support.reply')}</Label>
                                        <Textarea
                                            id="reply"
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder={t('support.reply_placeholder')}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={replyMutation.isPending || !replyMessage.trim()}>
                                            {replyMutation.isPending ? (
                                                <LoadingSpinner className="mr-2 h-4 w-4" />
                                            ) : (
                                                <Send className="mr-2 h-4 w-4" />
                                            )}
                                            {t('support.send_reply')}
                                        </Button>
                                    </div>
                                </form>
                            </CardFooter>
                        )}
                    </Card>
                </div>

                {/* Sidebar - Details */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('support.ticket_details')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">{t('support.category')}</span>
                                <span className="font-medium">{t(`support.categories.${ticket.category}`)}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">{t('support.priority')}</span>
                                <Badge variant="outline" className="capitalize">
                                    {t(`support.priority_levels.${ticket.priority}`)}
                                </Badge>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground block mb-1">{t('support.created')}</span>
                                <span className="font-medium text-sm">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {ticket.assigned_to_name && (
                                <div>
                                    <span className="text-sm text-muted-foreground block mb-1">{t('support.assigned_to')}</span>
                                    <span className="font-medium text-sm">{ticket.assigned_to_name}</span>
                                </div>
                            )}
                        </CardContent>
                        {ticket.status !== 'closed' && (
                            <CardFooter>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => closeMutation.mutate()}
                                    disabled={closeMutation.isPending}
                                >
                                    {t('support.close_ticket')}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
