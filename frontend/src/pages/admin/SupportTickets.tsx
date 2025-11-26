import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Loader2, Search, Filter } from 'lucide-react';
import { getAllSupportTickets } from '@/api/support';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import i18n from '@/i18n';

export default function AdminSupportTickets() {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin-support-tickets'],
        queryFn: getAllSupportTickets,
    });

    const filteredTickets = tickets?.filter(ticket => {
        const matchesSearch =
            ticket.title.toLowerCase().includes(search.toLowerCase()) ||
            ticket.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
            ticket.user_name.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('admin.support_tickets')}</h1>
                    <p className="text-muted-foreground">{t('admin.manage_tickets_desc')}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('common.search')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('support.filter_status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('common.all')}</SelectItem>
                                    <SelectItem value="open">{t('support.status_types.open')}</SelectItem>
                                    <SelectItem value="in_progress">{t('support.status_types.in_progress')}</SelectItem>
                                    <SelectItem value="resolved">{t('support.status_types.resolved')}</SelectItem>
                                    <SelectItem value="closed">{t('support.status_types.closed')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('support.ticket_id')}</TableHead>
                                    <TableHead>{t('support.subject')}</TableHead>
                                    <TableHead>{t('support.user')}</TableHead>
                                    <TableHead>{t('support.status')}</TableHead>
                                    <TableHead>{t('support.priority')}</TableHead>
                                    <TableHead>{t('support.assigned_to')}</TableHead>
                                    <TableHead>{t('support.last_updated')}</TableHead>
                                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTickets && filteredTickets.length > 0 ? (
                                    filteredTickets.map((ticket) => (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ticket.title}</span>
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {ticket.category}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{ticket.user_name}</TableCell>
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
                                                {ticket.assigned_to_name || <span className="text-muted-foreground italic">{t('support.unassigned')}</span>}
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
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            {t('support.no_tickets')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
