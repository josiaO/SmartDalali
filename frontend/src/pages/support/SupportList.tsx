import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, MessageSquare, Loader2 } from 'lucide-react';
import { getSupportTickets } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import i18n from '@/i18n';

export default function SupportList() {
    const { t } = useTranslation();
    const { data: tickets, isLoading, refetch, error } = useQuery({
        queryKey: ['support-tickets'],
        queryFn: getSupportTickets,
        refetchOnMount: 'always', // Always refetch when component mounts
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-500';
            case 'in_progress': return 'bg-yellow-500';
            case 'resolved': return 'bg-green-500';
            case 'closed': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 font-bold';
            case 'high': return 'text-orange-600 font-semibold';
            case 'medium': return 'text-yellow-600';
            case 'low': return 'text-green-600';
            default: return '';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('support.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('support.subtitle')}</p>
                </div>
                <Button asChild>
                    <Link to="/support/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('support.create_ticket')}
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('support.my_tickets')}</CardTitle>
                    <CardDescription>{t('support.tickets_description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {tickets && tickets.length > 0 ? (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('support.ticket_id')}</TableHead>
                                        <TableHead>{t('support.subject')}</TableHead>
                                        <TableHead>{t('support.category')}</TableHead>
                                        <TableHead>{t('support.status')}</TableHead>
                                        <TableHead>{t('support.priority')}</TableHead>
                                        <TableHead>{t('support.last_updated')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ticket.title}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {ticket.description}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{t(`support.categories.${ticket.category}`)}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusColor(ticket.status)} hover:${getStatusColor(ticket.status)}`}>
                                                    {t(`support.status_types.${ticket.status}`)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={getPriorityColor(ticket.priority)}>
                                                    {t(`support.priority_levels.${ticket.priority}`)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {formatDistanceToNow(new Date(ticket.updated_at), {
                                                    addSuffix: true,
                                                    locale: enUS
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link to={`/support/${ticket.id}`}>
                                                        <MessageSquare className="h-4 w-4 mr-1" />
                                                        {t('common.view')}
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-lg font-semibold">{t('support.no_tickets')}</h3>
                            <p className="text-muted-foreground mb-4">{t('support.no_tickets_desc')}</p>
                            <Button asChild variant="outline">
                                <Link to="/support/new">{t('support.create_first_ticket')}</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
