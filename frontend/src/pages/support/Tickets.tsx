import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Headphones, Plus, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getSupportTickets, closeTicket, type SupportTicket as Ticket } from '@/api/support';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
  )
}

export default function Tickets() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const data = await getSupportTickets();
      const results = Array.isArray(data) ? data : (data as any).results || [];
      setTickets(results);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast({
        title: t('common.error'),
        description: t('notifications.error_occurred'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('common.confirm_delete'))) return;
    try {
      await closeTicket(id);
      toast({
        title: t('common.success'),
        description: t('support.ticket_closed'),
      });
      loadTickets();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('notifications.error_occurred'),
        variant: 'destructive',
      });
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      open: 'default',
      in_progress: 'secondary',
      closed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 font-bold';
      case 'medium': return 'text-yellow-600 font-medium';
      case 'low': return 'text-green-600';
      case 'urgent': return 'text-red-700 font-extrabold';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('support.title')}</h1>
          <p className="text-muted-foreground">
            {isAdmin ? t('support.admin_desc') : t('support.user_desc')}
          </p>
        </div>
        <Button onClick={() => navigate('/support/create')} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {t('support.create_ticket')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('support.status_types.open')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground">{t('support.stats.needing_attention')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('support.status_types.in_progress')}</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground">{t('support.stats.being_handled')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('support.status_types.closed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedTickets}</div>
            <p className="text-xs text-muted-foreground">{t('support.stats.resolved')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          {isAdmin ? t('support.all_tickets') : t('support.my_tickets')}
        </h2>

        {tickets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Headphones className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{t('support.no_tickets')}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                {t('support.no_tickets_desc')}
              </p>
              <Button onClick={() => navigate('/support/create')} variant="outline">
                {t('support.create_first_ticket')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">#{String(ticket.id).slice(0, 8)}</span>
                        <h3 className="font-semibold text-lg hover:underline cursor-pointer" onClick={() => navigate(`/support/${ticket.id}`)}>
                          {ticket.subject}
                        </h3>
                        {getStatusBadge(ticket.status)}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(ticket.created_at), 'PPP')}</span>
                        <span>•</span>
                        <span className={getPriorityColor(ticket.priority)}>
                          {t(`support.priority_levels.${ticket.priority}`)}
                        </span>
                        {isAdmin && (
                          <>
                            <span>•</span>
                            <span>{ticket.user_name}</span>
                          </>
                        )}
                      </div>

                      <p className="mt-2 text-sm line-clamp-2 text-foreground/80">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/support/${ticket.id}`)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t('common.view')}
                      </Button>
                      {isAdmin && ticket.status !== 'closed' && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(String(ticket.id))}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('common.close')}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
