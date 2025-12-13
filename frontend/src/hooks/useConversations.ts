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
  Message, // Import Message interface
} from '@/api/communications';

interface MessageData {
  results?: Message[];
}

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
    }) => sendMessage(
      conversationId,
      { content, attachments },
      parentMessageId
    ),
    onMutate: async (newMsg) => {
      await queryClient.cancelQueries({ queryKey: ['messages', newMsg.conversationId] });

      const previousMessages = queryClient.getQueryData(['messages', newMsg.conversationId]);

      queryClient.setQueryData(['messages', newMsg.conversationId], (old: MessageData | undefined) => {
        const optimisticMessage: Message = {
          id: Date.now(), // Temporary ID
          text: newMsg.content,
          sender_name: 'Me', // Placeholder sender
          sender: -1, // Placeholder for current user id
          sender_role: 'user', // Placeholder
          created_at: new Date().toISOString(),
          is_read: false,
          isOptimistic: true,
          attachments: newMsg.attachments ? Array.from(newMsg.attachments).map(f => ({
            id: Date.now(), // Temp ID
            file_url: URL.createObjectURL(f),
            file_name: f.name,
            file_type: f.type,
            file_size: f.size,
            file_size_display: `${(f.size / 1024).toFixed(0)} KB`,
            mime_type: f.type,
            uploaded_at: new Date().toISOString(),
          })) : []
        };

        if (old?.results) {
          return { ...old, results: [...old.results, optimisticMessage] };
        }
        return { results: [optimisticMessage] };
      });

      return { previousMessages };
    },
    onError: (err, newMsg, context: { previousMessages: MessageData | undefined } | unknown) => {
      queryClient.setQueryData(['messages', newMsg.conversationId], (context as { previousMessages: MessageData | undefined })?.previousMessages);
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
    mutationFn: ({ conversationId, messageId }: { conversationId: number; messageId: number }) =>
      deleteMessageForMe(conversationId, messageId),
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
