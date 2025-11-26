import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Headphones, Plus, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { fetchTickets, createTicket, deleteTicket, type Ticket } from '@/api/support';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Tickets() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superuser';
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      const data = await fetchTickets();
      const results = Array.isArray(data) ? data : (data as any).results || [];
      setTickets(results);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTicket(formData);
      toast({
        title: 'Success',
        description: 'Ticket created successfully',
      });
      setShowForm(false);
      setFormData({ subject: '', description: '', priority: 'medium' });
      loadTickets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create ticket',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await deleteTicket(id);
      toast({
        title: 'Success',
        description: 'Ticket deleted successfully',
      });
      loadTickets();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete ticket',
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
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage support requests' : 'Get help from our support team'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Active requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Being resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedTickets}</div>
            <p className="text-xs text-muted-foreground mt-1">Resolved tickets</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {isAdmin ? 'All Tickets' : 'My Tickets'}
        </h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? 'Cancel' : 'Create New Ticket'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-primary">
          <CardHeader>
            <CardTitle>Create Support Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your issue"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <Button type="submit">Submit Ticket</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No tickets found</p>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                      {getStatusBadge(ticket.status)}
                      <span className={`text-xs font-medium uppercase ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Created by {ticket.created_by.first_name} {ticket.created_by.last_name} on {format(new Date(ticket.created_at), 'PPP')}
                    </p>
                    <p className="mt-2 text-sm">{ticket.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ticket.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
