import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchTickets,
    fetchTicket,
    createTicket,
    replyToTicket,
    type CreateTicketData,
    type ReplyToTicketData,
} from '@/api/support';
import { useUI } from '@/contexts/UIContext';

export function useSupport() {
    const { showError, showSuccess } = useUI();
    const queryClient = useQueryClient();

    // Fetch all tickets
    const {
        data: tickets = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['tickets'],
        queryFn: fetchTickets,
    });

    // Fetch single ticket
    const useTicket = (id: string) => {
        return useQuery({
            queryKey: ['ticket', id],
            queryFn: () => fetchTicket(id),
            enabled: !!id,
        });
    };

    // Create ticket mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateTicketData) => createTicket(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            showSuccess('Support ticket created successfully');
        },
        onError: (error: any) => {
            showError(error.message || 'Failed to create ticket');
        },
    });

    // Reply to ticket mutation
    const replyMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ReplyToTicketData }) =>
            replyToTicket(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            showSuccess('Reply sent successfully');
        },
        onError: (error: any) => {
            showError(error.message || 'Failed to send reply');
        },
    });

    return {
        tickets,
        isLoading,
        error,
        useTicket,
        createTicket: createMutation.mutateAsync,
        replyToTicket: replyMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isReplying: replyMutation.isPending,
    };
}
