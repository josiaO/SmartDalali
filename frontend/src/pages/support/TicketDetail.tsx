import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, Shield, User, Clock, CheckCircle, AlertOctagon, Paperclip } from 'lucide-react';
import { getSupportTicket, replyToTicket, closeTicket, updateSupportTicket } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatDistanceToNow, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function TicketDetail() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
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

    const updateMutation = useMutation({
        mutationFn: (data: any) => updateSupportTicket(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
            toast({
                title: t('common.success'),
                description: t('support.ticket_updated'),
            });
        },
        onError: () => {
            toast({
                title: t('common.error'),
                description: t('notifications.error_occurred'),
                variant: 'destructive',
            });
        }
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
            case 'open': return 'bg-blue-500 hover:bg-blue-600';
            case 'in_progress': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'resolved': return 'bg-green-500 hover:bg-green-600';
            case 'closed': return 'bg-gray-500 hover:bg-gray-600';
            default: return 'bg-gray-500';
        }
    };

    const renderAttachments = (attachments?: any[]) => {
        if (!attachments || attachments.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-2 mt-3">
                {attachments.map((att: any, index: number) => (
                    <a
                        key={index}
                        href={att.file || att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs bg-muted/50 hover:bg-muted px-2 py-1.5 rounded transition-colors border"
                    >
                        <Paperclip className="h-3 w-3" />
                        <span className="max-w-[150px] truncate">{att.filename || att.name || 'Attachment'}</span>
                    </a>
                ))}
            </div>
        );
    };

    if (isLoading) return (
        <div className="flex h-[50vh] items-center justify-center">
            <LoadingSpinner className="h-8 w-8 text-primary" />
        </div>
    );

    if (!ticket) return (
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <AlertOctagon className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('support.ticket_not_found')}</h2>
            <Button onClick={() => navigate('/support')}>{t('common.back')}</Button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto py-8">
            <Button variant="ghost" onClick={() => navigate('/support')} className="mb-6 hover:translate-x-[-4px] transition-transform">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
            </Button>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Conversation */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="bg-muted/10">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={getStatusColor(ticket.status)}>
                                            {t(`support.status_types.${ticket.status}`)}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">#{ticket.id}</span>
                                    </div>
                                    <CardTitle className="text-xl leading-snug">{ticket.subject}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 p-4 rounded-lg border mb-8">
                                <p className="whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                                {renderAttachments(ticket.attachments)}
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{t('support.conversation')}</h3>
                                    <Badge variant="secondary" className="rounded-full px-2">{ticket.messages.length}</Badge>
                                </div>

                                {ticket.messages.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                                        <p>{t('support.no_replies')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {ticket.messages.map((message) => {
                                            const isAgent = message.sender_type === 'admin' || message.sender_type === 'agent';
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex gap-4 ${isAgent ? 'flex-row-reverse' : ''}`}
                                                >
                                                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${isAgent ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                                                        {isAgent ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                                    </div>
                                                    <div className={`flex-1 max-w-[85%] rounded-2xl p-4 shadow-sm ${isAgent ? 'bg-primary/5 border border-primary/10 rounded-tr-none' : 'bg-card border rounded-tl-none'}`}>
                                                        <div className={`flex justify-between items-center mb-2 ${isAgent ? 'flex-row-reverse' : ''}`}>
                                                            <span className="font-semibold text-sm">
                                                                {isAgent ? t('support.support_team') : message.sender_name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: enUS })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                                                        {renderAttachments(message.attachments)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        {ticket.status !== 'closed' && (
                            <CardFooter className="block pt-6 bg-muted/5 border-t">
                                <form onSubmit={handleReply} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reply">{t('support.reply')}</Label>
                                        <Textarea
                                            id="reply"
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            placeholder={t('support.reply_placeholder')}
                                            rows={4}
                                            className="resize-none"
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

                {/* Right Column - Details Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertOctagon className="h-5 w-5 text-muted-foreground" />
                                {t('support.ticket_details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-muted-foreground">{t('support.category')}</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium bg-muted px-2 py-1 rounded text-sm w-fit">
                                        {t(`support.categories.${ticket.category}`)}
                                    </span>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <span className="text-sm font-medium text-muted-foreground">{t('support.priority')}</span>
                                {isAdmin ? (
                                    <Select
                                        value={ticket.priority}
                                        onValueChange={(value) => updateMutation.mutate({ priority: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant="outline" className="w-fit capitalize">
                                        {t(`support.priority_levels.${ticket.priority}`)}
                                    </Badge>
                                )}
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <span className="text-sm font-medium text-muted-foreground">{t('support.status')}</span>
                                {isAdmin ? (
                                    <Select
                                        value={ticket.status}
                                        onValueChange={(value) => updateMutation.mutate({ status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="font-medium capitalize flex items-center gap-2">
                                        {ticket.status !== 'open' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                        {t(`support.status_types.${ticket.status}`)}
                                    </span>
                                )}
                            </div>

                            <Separator />

                            <div className="grid gap-1">
                                <span className="text-sm font-medium text-muted-foreground">{t('support.created')}</span>
                                <span className="text-sm">
                                    {format(new Date(ticket.created_at), 'PPP pp')}
                                </span>
                            </div>

                            {ticket.assigned_to_name && (
                                <>
                                    <Separator />
                                    <div className="grid gap-1">
                                        <span className="text-sm font-medium text-muted-foreground">{t('support.assigned_to')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                {ticket.assigned_to_name.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium">{ticket.assigned_to_name}</span>
                                        </div>
                                    </div>
                                </>
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
