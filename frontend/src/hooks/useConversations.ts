import { useQuery } from '@tanstack/react-query';
import { fetchConversations, fetchMessages } from '@/api/communications';
import { FEATURES } from '@/lib/constants';
import { useUI } from '@/contexts/UIContext';

export function useConversations() {
    const { showMessagingDisabled } = useUI();

    // Fetch conversations (returns empty array if disabled)
    const {
        data: conversations = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['conversations'],
        queryFn: fetchConversations,
        enabled: FEATURES.MESSAGING_ENABLED,
    });

    // Fetch messages for a conversation
    const useMessages = (conversationId: string) => {
        return useQuery({
            queryKey: ['messages', conversationId],
            queryFn: () => fetchMessages(conversationId),
            enabled: !!conversationId && FEATURES.MESSAGING_ENABLED,
        });
    };

    /**
     * Attempt to send message (will show disabled message)
     */
    const sendMessage = async (conversationId: string, content: string) => {
        if (!FEATURES.MESSAGING_ENABLED) {
            showMessagingDisabled();
            return null;
        }
        // This won't be reached in launch mode
        return null;
    };

    return {
        conversations,
        isLoading,
        error,
        useMessages,
        sendMessage,
        isMessagingEnabled: FEATURES.MESSAGING_ENABLED,
    };
}
