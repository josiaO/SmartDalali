import api from '@/lib/api';
import { API_ENDPOINTS, FEATURES } from '@/lib/constants';

export interface Conversation {
    id: number;
    participants: User[];
    last_message?: Message;
    unread_count: number;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_picture?: string;
}

export interface Message {
    id: number;
    conversation: number;
    sender: User;
    content: string;
    created_at: string;
    read: boolean;
}

/**
 * Fetch all conversations (DISABLED IN LAUNCH MODE)
 * Returns empty array if messaging is disabled
 */
export async function fetchConversations(): Promise<Conversation[]> {
    if (!FEATURES.MESSAGING_ENABLED) {
        // Return empty array for disabled feature
        return [];
    }

    const response = await api.get(API_ENDPOINTS.COMMUNICATIONS.CONVERSATIONS);
    return response.data;
}

/**
 * Fetch messages for a conversation (DISABLED IN LAUNCH MODE)
 * Returns empty array if messaging is disabled
 */
export async function fetchMessages(conversationId: string): Promise<Message[]> {
    if (!FEATURES.MESSAGING_ENABLED) {
        // Return empty array for disabled feature
        return [];
    }

    const response = await api.get(API_ENDPOINTS.COMMUNICATIONS.MESSAGES(conversationId));
    return response.data;
}

/**
 * Send a message (DISABLED IN LAUNCH MODE)
 * Throws error if messaging is disabled
 */
export async function sendMessage(
    conversationId: string,
    content: string
): Promise<Message> {
    if (!FEATURES.MESSAGING_ENABLED) {
        throw new Error('Messaging is currently disabled');
    }

    const response = await api.post(API_ENDPOINTS.COMMUNICATIONS.MESSAGES(conversationId), {
        content,
    });
    return response.data;
}
