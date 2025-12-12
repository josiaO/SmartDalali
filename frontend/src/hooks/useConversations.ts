import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  fetchNotifications,
  markConversationAsRead,
  startConversation,
  addReaction,
  getUnreadCount,
  markNotificationAsRead,
  deleteConversation,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from '@/api/communications';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
  });
}

export function useMessages(conversationId: number, enablePolling = false) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: enablePolling ? 3000 : false, // Poll every 3 seconds if enabled
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
      attachments,
      parentMessageId,
    }: {
      conversationId: number;
      content: string;
      attachments?: File[];
      parentMessageId?: number;
    }) => sendMessage(conversationId, content, attachments, parentMessageId),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['messages', newMsg.conversationId] });

      const previousMessages = queryClient.getQueryData(['messages', newMsg.conversationId]);

      queryClient.setQueryData(['messages', newMsg.conversationId], (old: any) => {
        const optimisticMessage = {
          id: Date.now(), // Temporary ID
          content: newMsg.content,
          sender: { id: 'me', first_name: 'Me', last_name: '' }, // Placeholder sender
          created_at: new Date().toISOString(),
          read: false,
          isOptimistic: true,
          attachments: newMsg.attachments ? Array.from(newMsg.attachments).map(f => ({ file: URL.createObjectURL(f), file_type: f.type })) : []
        };

        if (old?.results) {
          return { ...old, results: [...old.results, optimisticMessage] };
        }
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      return { previousMessages };
    },
    onError: (err, newMsg, context) => {
      queryClient.setQueryData(['messages', newMsg.conversationId], context?.previousMessages);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => markConversationAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, propertyId }: { userId: number; propertyId?: number }) =>
      startConversation(userId, propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) =>
      addReaction(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: number) => deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteMessageForMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => deleteMessageForMe(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useDeleteMessageForEveryone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: number) => deleteMessageForEveryone(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
