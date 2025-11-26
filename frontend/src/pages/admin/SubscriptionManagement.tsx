import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, Shield, Plus, Loader2 } from 'lucide-react';
import {
  fetchAgents,
  fetchSubscriptionPlans,
  assignPlanToAgent,
  removePlanFromAgent,
  type Agent,
  type SubscriptionPlan
} from '@/api/subscriptions';

export default function SubscriptionManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  // Fetch all agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  });

  // Fetch all subscription plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: fetchSubscriptionPlans,
  });

  // Assign plan to agent mutation
  const assignPlanMutation = useMutation({
    mutationFn: ({ planId, agentId }: { planId: number; agentId: number }) =>
      assignPlanToAgent(planId, agentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success(data.message);
      setIsDialogOpen(false);
      setSelectedAgentId('');
      setSelectedPlanId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to assign subscription');
    },
  });

  // Remove plan from agent mutation
  const removePlanMutation = useMutation({
    mutationFn: ({ planId, agentId }: { planId: number; agentId: number }) =>
      removePlanFromAgent(planId, agentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove subscription');
    },
  });

  const handleAssignPlan = () => {
    if (!selectedAgentId || !selectedPlanId) {
      toast.error('Please select both an agent and a plan');
      return;
    }
    assignPlanMutation.mutate({
      planId: parseInt(selectedPlanId),
      agentId: parseInt(selectedAgentId),
    });
  };

  const handleRemovePlan = (agentId: number) => {
    const agent = agents?.find((a) => a.id === agentId);
    if (!agent?.agent_profile) {
      toast.error('Agent has no subscription to remove');
      return;
    }

    // We need to find which plan the agent has
    // For now, we'll use a placeholder plan ID (this should be improved)
    const planId = 1; // TODO: Get actual plan ID from agent profile

    removePlanMutation.mutate({ planId, agentId });
  };

  const getStatusBadge = (agent: Agent) => {
    if (!agent.agent_profile) {
      return <Badge variant="secondary">No Subscription</Badge>;
    }

    if (agent.agent_profile.subscription_active) {
      return <Badge variant="default">Active</Badge>;
    }

    return <Badge variant="destructive">Inactive</Badge>;
  };

  if (agentsLoading || plansLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading subscriptions...</p>
        </CardContent>
      </Card>
    );
  }

  // Filter agents to only show those with agent profiles
  const agentsWithProfiles = agents?.filter((agent) => agent.agent_profile) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agent Subscription Management</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Agent</Label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents?.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.username} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subscription Plan</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.filter(p => p.is_active).map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - TZS {plan.price} ({plan.duration_days} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAssignPlan}
                disabled={!selectedAgentId || !selectedPlanId || assignPlanMutation.isPending}
                className="w-full"
              >
                {assignPlanMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Plan'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentsWithProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              agentsWithProfiles.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">
                    {agent.first_name && agent.last_name
                      ? `${agent.first_name} ${agent.last_name}`
                      : agent.username}
                  </TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>
                    {agent.agent_profile?.agency_name || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(agent)}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {agent.agent_profile?.subscription_expires ? (
                      <>
                        <Calendar className="h-4 w-4" />
                        {new Date(agent.agent_profile.subscription_expires).toLocaleDateString()}
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {agent.agent_profile?.verified ? (
                      <Badge variant="default">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unverified</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {agent.agent_profile?.subscription_active && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemovePlan(agent.id)}
                        disabled={removePlanMutation.isPending}
                      >
                        {removePlanMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
