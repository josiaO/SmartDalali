import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTickets, createTicket, replyToTicket } from '@/api/support';

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: fetchTickets,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      replyToTicket(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}
