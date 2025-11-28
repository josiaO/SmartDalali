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
  sender_avatar?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  reaction_summary?: Record<string, number>;
  thread_info?: ThreadInfo;
}

export interface OtherParticipant {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface LastMessage {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;
  created_at: string;
  is_read: boolean;
  has_attachments: boolean;
}

export interface Conversation {
  id: number;
  participants: number[];
  other_participant: OtherParticipant;
  property?: number;
  property_title?: string;
  property_image?: string;
  last_message?: LastMessage;
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

// API Functions
export async function fetchConversations(): Promise<Conversation[]> {
  const res = await api.get('/api/communications/conversations/');
  return res.data;
}

export async function fetchMessages(conversationId: number): Promise<Message[]> {
  const res = await api.get(`/api/communications/conversations/${conversationId}/messages/`);
  return res.data;
}

export async function sendMessage(
  conversationId: number,
  content: string,
  attachments?: File[],
  parentMessageId?: number
): Promise<Message> {
  const formData = new FormData();
  formData.append('content', content);

  if (parentMessageId) {
    formData.append('parent_message_id', parentMessageId.toString());
  }

  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append('attachments', file);
    });
  }

  const res = await api.post(
    `/api/communications/conversations/${conversationId}/send_message/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return res.data;
}

export async function markConversationAsRead(conversationId: number): Promise<void> {
  await api.post(`/api/communications/conversations/${conversationId}/mark_read/`);
}

export async function startConversation(
  userId: number,
  propertyId?: number
): Promise<Conversation> {
  const res = await api.post('/api/communications/conversations/start_conversation/', {
    user_id: userId,
    property_id: propertyId,
  });
  return res.data;
}

export async function addReaction(messageId: number, emoji: string): Promise<void> {
  await api.post(`/api/communications/messages/${messageId}/react/`, { emoji });
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get('/api/communications/conversations/unread_count/');
  return res.data.unread_count;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await api.get('/api/communications/notifications/');
  return res.data;
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await api.patch(`/api/communications/notifications/${notificationId}/`, { read: true });
}
