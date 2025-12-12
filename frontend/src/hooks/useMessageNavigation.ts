import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStartConversation } from './useConversations';
import { useToast } from './use-toast';

interface Property {
    id: number;
    title: string;
    owner?: number | { id: number };
}

export function useMessageNavigation() {
    const navigate = useNavigate();
    const startConversation = useStartConversation();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const navigateToMessage = async (userId: number, property?: Property) => {
        if (isLoading) return;

        setIsLoading(true);
        try {
            // Start or get existing conversation with property context
            const conversation = await startConversation.mutateAsync({
                userId,
                propertyId: property?.id,
            });

            // Navigate to messages page with the conversation pre-selected
            navigate(`/agent/messages?conversationId=${conversation.id}`);

            toast({
                title: 'Success',
                description: property
                    ? `Started conversation about ${property.title}`
                    : 'Conversation started',
            });
        } catch (error) {
            console.error('Failed to start conversation:', error);
            toast({
                title: 'Error',
                description: 'Failed to start conversation. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        navigateToMessage,
        isLoading,
    };
}
