import api from '@/lib/axios';

export interface TicketMessage {
  id: number;
  ticket: number;
  sender_type: 'admin' | 'user';
  sender_name: string;
  sender_email: string;
  message: string;
  created_at: string;
  attachments: any[];
}
export interface ApiError {
  response?: {
    data?: {
      [key: string]: any;
    };
  };
  message: string;
}
export interface SupportTicket {
  id: string | number; // Backend uses UUID which comes as string
  ticket_number: string;
  user: number;
  user_name: string;
  user_email: string;
  subject: string;
  description: string;
  category: 'account' | 'property' | 'payment' | 'technical' | 'report' | 'feature' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to: number | null;
  assigned_to_name: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  messages: TicketMessage[];
  message_count: number;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  category: string;
  priority: string;
  attachments?: File[];
}

export const getSupportTickets = async () => {
  try {
    const response = await api.get<SupportTicket[]>('/api/v1/properties/support/tickets/');
    console.log('Support tickets response:', response.data);
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Error fetching support tickets:', apiError.response?.data || apiError.message);
    throw error;
  }
};

export const getSupportTicket = async (id: string) => {
  try {
    const response = await api.get<SupportTicket>(`/api/v1/properties/support/tickets/${id}/`);
    console.log('Support ticket detail response:', response.data);
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Error fetching support ticket:', apiError.response?.data || apiError.message);
    throw error;
  }
};

export const createSupportTicket = async (data: CreateTicketData) => {
  try {
    console.log('Creating support ticket with data:', data);

    let requestData: any = data;
    let headers = {};

    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      formData.append('subject', data.subject);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('priority', data.priority);
      data.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      requestData = formData;
      headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await api.post<SupportTicket>('/api/v1/properties/support/tickets/', requestData, { headers });
    console.log('Support ticket created:', response.data);
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError
    console.error('Error creating support ticket:', apiError.response?.data || apiError.message);
    throw error;
  }
};

export const replyToTicket = async (id: string, message: string) => {
  const response = await api.post<TicketMessage>(`/api/v1/properties/support/tickets/${id}/reply/`, { message });
  return response.data;
};

export const closeTicket = async (id: string) => {
  const response = await api.post(`/api/v1/properties/support/tickets/${id}/close/`);
  return response.data;
};

export const updateSupportTicket = async (id: string, data: any) => {
  const response = await api.patch<SupportTicket>(`/api/v1/properties/support/tickets/${id}/`, data);
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

