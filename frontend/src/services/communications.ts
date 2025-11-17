import api from '@/lib/api';

export const communicationsService = {
  // Conversations
  fetchConversations: () => api.get('/communications/conversations/'),
  startConversation: (payload: { user_id: number; property_id?: number }) =>
    api.post('/communications/conversations/start_conversation/', payload),
  fetchConversationMessages: (conversationId: number | string) =>
    api.get(`/communications/conversations/${conversationId}/messages/`),
  sendConversationMessage: (conversationId: number | string, data: { content: string }) =>
    api.post(`/communications/conversations/${conversationId}/send_message/`, data),
  unreadCount: () =>
    api.get('/communications/conversations/unread_count/'),

  // Messages
  listMessages: () => api.get('/communications/messages/'),
  markMessageRead: (messageId: number | string) =>
    api.post(`/communications/messages/${messageId}/mark_read/`),

  // Notifications
  fetchNotifications: () => api.get('/communications/notifications/'),
  updateNotification: (id: number | string, data: Record<string, unknown>) =>
    api.put(`/communications/notifications/${id}/`, data),
  deleteNotification: (id: number | string) =>
    api.delete(`/communications/notifications/${id}/`),
};

export default communicationsService;


