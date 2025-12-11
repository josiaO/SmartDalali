import api from '@/lib/axios';

export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    avatar: string | null;
}

export interface Message {
    id: number;
    sender: number;
    sender_name: string;
    sender_role: string;
    sender_avatar: string | null;
    text: string;
    attachment: string | null;
    read_at: string | null;
    is_deleted: boolean;
    created_at: string;
}

export interface Conversation {
    id: number;
    user: number;
    agent: number;
    other_participant: User;
    property: number | null;
    property_title: string | null;
    property_image: string | null;
    last_message: {
        id: number;
        text: string;
        sender_id: number;
        created_at: string;
        read_at: string | null;
    } | null;
    unread_count: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export const messagingService = {
    // Get all conversations
    getConversations: async () => {
        const response = await api.get<Conversation[]>('/api/v1/communications/conversations/');
        return response.data;
    },

    // Get active conversations
    getActiveConversations: async () => {
        const response = await api.get<Conversation[]>('/api/v1/communications/conversations/active/');
        return response.data;
    },

    // Start a conversation
    startConversation: async (agentId: number, propertyId?: number) => {
        const response = await api.post<Conversation>('/api/v1/communications/conversations/start_conversation/', {
            agent_id: agentId,
            property_id: propertyId
        });
        return response.data;
    },

    // Get messages for a conversation
    getMessages: async (conversationId: number) => {
        const response = await api.get<Message[]>(`/api/v1/communications/conversations/${conversationId}/messages/`);
        return response.data;
    },

    // Send a message (Text + Attachment)
    sendMessage: async (conversationId: number, data: { text?: string; attachment?: File }) => {
        const formData = new FormData();
        if (data.text) formData.append('text', data.text);
        if (data.attachment) formData.append('attachment', data.attachment);

        const response = await api.post<Message>(
            `/api/v1/communications/conversations/${conversationId}/send_message/`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
    },

    // Mark conversation as read
    markRead: async (conversationId: number) => {
        const response = await api.post(`/api/v1/communications/conversations/${conversationId}/mark_read/`);
        return response.data;
    },

    // Get total unread count
    getUnreadCount: async () => {
        const response = await api.get<{ unread_count: number }>('/api/v1/communications/conversations/unread_count/');
        return response.data;
    },

    // Delete a message (global soft delete)
    deleteMessage: async (conversationId: number, messageId: number) => {
        await api.delete(`/api/v1/communications/messages/${messageId}/`);
    },

    // Delete a message for me only
    deleteMessageForMe: async (conversationId: number, messageId: number) => {
        await api.delete(`/api/v1/communications/messages/${messageId}/delete_for_me/`);
    },

    // Clear conversation history
    clearConversation: async (conversationId: number) => {
        await api.post(`/api/v1/communications/conversations/${conversationId}/clear_history/`);
    }
};
