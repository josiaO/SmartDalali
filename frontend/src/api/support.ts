import api from '@/lib/axios';

export interface TicketReply {
  id: number;
  user: number;
  user_name: string;
  user_role: 'admin' | 'agent' | 'user';
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string | number; // Backend uses UUID which comes as string
  ticket_number: string;
  user: number;
  user_name: string;
  user_email: string;
  title: string;
  description: string;
  category: 'account' | 'property' | 'payment' | 'technical' | 'report' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: number | null;
  assigned_to_name: string | null;
  admin_reply: string | null;
  user_reply: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  replies: TicketReply[];
  reply_count: number;
}

export interface CreateTicketData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export const getSupportTickets = async () => {
  try {
    const response = await api.get<SupportTicket[]>('/api/v1/properties/support/tickets/');
    console.log('Support tickets response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching support tickets:', error.response?.data || error.message);
    throw error;
  }
};

export const getSupportTicket = async (id: string) => {
  try {
    const response = await api.get<SupportTicket>(`/api/v1/properties/support/tickets/${id}/`);
    console.log('Support ticket detail response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching support ticket:', error.response?.data || error.message);
    throw error;
  }
};

export const createSupportTicket = async (data: CreateTicketData) => {
  try {
    console.log('Creating support ticket with data:', data);
    const response = await api.post<SupportTicket>('/api/v1/properties/support/tickets/', data);
    console.log('Support ticket created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating support ticket:', error.response?.data || error.message);
    throw error;
  }
};

export const replyToTicket = async (id: string, message: string) => {
  const response = await api.post<TicketReply>(`/api/v1/properties/support/tickets/${id}/reply/`, { message });
  return response.data;
};

export const closeTicket = async (id: string) => {
  const response = await api.post(`/api/v1/properties/support/tickets/${id}/close/`);
  return response.data;
};

// Admin only
export const getAllSupportTickets = async () => {
  // The backend endpoint filters based on user role, so this is the same endpoint.
  // Admins see all, users see theirs.
  const response = await api.get<SupportTicket[]>('/api/v1/properties/support/tickets/');
  return response.data;
};

export const getSupportStats = async () => {
  const response = await api.get('/api/v1/properties/support/tickets/stats/');
  return response.data;
};
