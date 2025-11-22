import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

export interface Ticket {
    id: number;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    created_by: User;
    assigned_to?: User;
    created_at: string;
    updated_at: string;
    replies?: TicketReply[];
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

export interface TicketReply {
    id: number;
    ticket: number;
    message: string;
    created_by: User;
    created_at: string;
}

export interface CreateTicketData {
    subject: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
}

export interface ReplyToTicketData {
    message: string;
}

/**
 * Fetch all support tickets for the current user
 */
export async function fetchTickets(): Promise<Ticket[]> {
    const response = await api.get(API_ENDPOINTS.SUPPORT.TICKETS);
    return response.data;
}

/**
 * Fetch single ticket by ID
 */
export async function fetchTicket(id: string): Promise<Ticket> {
    const response = await api.get(API_ENDPOINTS.SUPPORT.TICKET_DETAIL(id));
    return response.data;
}

/**
 * Create a new support ticket
 */
export async function createTicket(data: CreateTicketData): Promise<Ticket> {
    const response = await api.post(API_ENDPOINTS.SUPPORT.TICKETS, data);
    return response.data;
}

/**
 * Reply to a support ticket
 */
export async function replyToTicket(
    id: string,
    data: ReplyToTicketData
): Promise<TicketReply> {
    const response = await api.post(API_ENDPOINTS.SUPPORT.REPLY(id), data);
    return response.data;
}
