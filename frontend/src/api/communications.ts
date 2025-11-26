import { UserProfile } from './auth';
import api from '@/lib/axios';

export interface Conversation {
  id: number;
  participants: UserProfile[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: number;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await api.get('/api/v1/communications/conversations/');
  return res.data;
}

export async function fetchMessages(conversationId: number): Promise<Message[]> {
  const res = await api.get('/api/v1/communications/messages/', {
    params: { conversation: conversationId }
  });
  return res.data;
}

export async function sendMessage(conversationId: number, content: string): Promise<Message> {
  const res = await api.post('/api/v1/communications/messages/', {
    conversation: conversationId,
    content
  });
  return res.data;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await api.get('/api/v1/communications/notifications/');
  return res.data;
}
