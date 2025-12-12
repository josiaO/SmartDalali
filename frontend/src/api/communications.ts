import { UserProfile } from './auth';
import api from '@/lib/axios';

export interface MessageAttachment {
  id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_size_display: string;
  mime_type: string;
  uploaded_at: string;
}

export interface MessageReaction {
  id: number;
  user: number;
  username: string;
  emoji: string;
  created_at: string;
}

export interface ThreadInfo {
  is_reply: boolean;
  parent_id?: number;
  parent_preview?: string;
  has_replies?: boolean;
  reply_count?: number;
}

export interface ConversationTag {
  id: number;
  name: string;
  color: string;
}

export interface ConversationAnalysis {
  id: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number;
  intent: string;
  priority: 'high' | 'medium' | 'low';
  suggested_response?: string;
  key_topics: string[];
  action_items: string[];
  analyzed_at: string;
}

export interface Message {
  id: number;
  sender: number;
  sender_name: string;
  sender_role: string;
  sender_avatar?: string | null;
  text: string;
  attachment?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  created_at: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  reaction_summary?: Record<string, number>;
  thread_info?: ThreadInfo;
  is_deleted?: boolean;
  reply_to?: Message;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export interface OtherParticipant {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string | null;
}

export interface LastMessage {
  id: number;
  content?: string;
  text?: string;
  sender_id: number;
  sender_name?: string;
  created_at: string;
  read_at?: string | null;
  is_read?: boolean;
  has_attachments?: boolean;
}

export interface Conversation {
  id: number;
  user?: number;
  agent?: number;
  participants?: number[];
  other_participant: OtherParticipant | User;
  property?: number | null;
  property_title?: string | null;
  property_image?: string | null;
  last_message?: LastMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  analysis?: ConversationAnalysis;
  tags?: ConversationTag[];
}

export interface Notification {
  id: string;
  user: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

// Unified Service Object (from messaging.ts) + Individual Functions (from communications.ts)
export const communicationService = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/api/v1/communications/conversations/');
    return response.data;
  },

  // Get active conversations
  getActiveConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<Conversation[]>('/api/v1/communications/conversations/active/');
    return response.data;
  },

  // Start a conversation
  startConversation: async (recipientId: number, propertyId?: number): Promise<Conversation> => {
    const response = await api.post<Conversation>('/api/v1/communications/conversations/start_conversation/', {
      agent_id: recipientId,
      user_id: recipientId, // Support both field names for compatibility
      property_id: propertyId
    });
    return response.data;
  },

  // Get messages for a conversation
  getMessages: async (conversationId: number): Promise<Message[]> => {
    const response = await api.get<Message[]>(`/api/v1/communications/conversations/${conversationId}/messages/`);
    return response.data;
  },

  // Send a message (supports both styles)
  sendMessage: async (
    conversationId: number,
    data: { text?: string; content?: string; attachment?: File; attachments?: File[] },
    replyToId?: number
  ): Promise<Message> => {
    const formData = new FormData();
    const text = data.text || data.content || '';

    if (text) formData.append('text', text);
    formData.append('conversation', conversationId.toString());

    if (replyToId) {
      formData.append('reply_to_id', replyToId.toString());
    }

    // Handle single or multiple attachments
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    } else if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file) => {
        formData.append('attachment', file);
      });
    }

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
  markRead: async (conversationId: number): Promise<void> => {
    await api.post(`/api/v1/communications/conversations/${conversationId}/mark_read/`);
  },

  // Get total unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ unread_count: number }>('/api/v1/communications/conversations/unread_count/');
    return response.data.unread_count;
  },

  // Delete a message (global soft delete)
  deleteMessage: async (conversationId: number, messageId: number): Promise<void> => {
    await api.delete(`/api/v1/communications/messages/${messageId}/`);
  },

  // Delete a message for me only
  deleteMessageForMe: async (conversationId: number, messageId: number): Promise<void> => {
    await api.delete(`/api/v1/communications/messages/${messageId}/delete_for_me/`);
  },

  // Delete for everyone
  deleteMessageForEveryone: async (messageId: number): Promise<void> => {
    await api.delete(`/api/v1/communications/messages/${messageId}/delete_for_everyone/`);
  },

  // Clear conversation history
  clearConversation: async (conversationId: number): Promise<void> => {
    await api.post(`/api/v1/communications/conversations/${conversationId}/clear_history/`);
  },

  // Add reaction
  addReaction: async (messageId: number, emoji: string): Promise<void> => {
    await api.post(`/api/v1/communications/messages/${messageId}/react/`, { emoji });
  },

  // Notifications
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/api/v1/communications/notifications/');
    return response.data;
  },

  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/api/v1/communications/notifications/${notificationId}/`, { read: true });
  },
};

// Legacy exports for backward compatibility
export const messagingService = communicationService;

// Individual function exports (for backward compatibility with old imports)
export const fetchConversations = communicationService.getConversations;
export const fetchMessages = communicationService.getMessages;
export const sendMessage = communicationService.sendMessage;
export const markConversationAsRead = communicationService.markRead;
export const startConversation = communicationService.startConversation;
export const addReaction = communicationService.addReaction;
export const getUnreadCount = communicationService.getUnreadCount;
export const fetchNotifications = communicationService.getNotifications;
export const markNotificationAsRead = communicationService.markNotificationAsRead;
export const deleteConversation = communicationService.clearConversation;
export const deleteMessageForMe = communicationService.deleteMessageForMe;
export const deleteMessageForEveryone = communicationService.deleteMessageForEveryone;
