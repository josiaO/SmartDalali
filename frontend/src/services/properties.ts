import api from '@/lib/api';
import type { AxiosRequestConfig } from 'axios';

type Params = Record<string, unknown>;
type Payload = FormData | Record<string, unknown>;

const withFormHeaders = (data: Payload): AxiosRequestConfig | undefined =>
  data instanceof FormData
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined;

export const propertiesService = {
  // Listings
  fetchListings: (params?: Params) => api.get('/properties/', { params }),
  fetchListing: (id: number | string) => api.get(`/properties/${id}/`),
  createListing: (data: Payload) =>
    api.post('/properties/', data, withFormHeaders(data)),
  updateListing: (id: number | string, data: Payload) =>
    api.put(`/properties/${id}/`, data, withFormHeaders(data)),
  partialUpdateListing: (id: number | string, data: Payload) =>
    api.patch(`/properties/${id}/`, data, withFormHeaders(data)),
  deleteListing: (id: number | string) => api.delete(`/properties/${id}/`),

  // Visits
  fetchVisits: () => api.get('/properties/visits/'),
  scheduleVisit: (data: Record<string, unknown>) =>
    api.post('/properties/visits/', data),

  // Payments
  fetchPayments: (params?: Params) => api.get('/properties/payments/', { params }),
  fetchAdminPayments: () => api.get('/properties/payments/admin_list/'),
  retryPayment: (id: number | string) =>
    api.post(`/properties/payments/${id}/retry/`),
  requestMpesaStk: (propertyId: number | string, payload: Record<string, unknown>) =>
    api.post(`/properties/payments/mpesa/stk/${propertyId}/`, payload),
  paymentStatus: (paymentId: number | string) =>
    api.get(`/properties/payments/status/${paymentId}/`),
  fetchSubscriptionPlans: () => api.get('/properties/payments/subscription/'),

  // Support tickets
  fetchTickets: () => api.get('/properties/support/tickets/'),
  fetchTicket: (id: number | string) => api.get(`/properties/support/tickets/${id}/`),
  createTicket: (data: Record<string, unknown>) =>
    api.post('/properties/support/tickets/', data),
  replyToTicket: (id: number | string, data: Record<string, unknown>) =>
    api.post(`/properties/support/tickets/${id}/reply/`, data),
  assignTicket: (id: number | string, payload: Record<string, unknown>) =>
    api.post(`/properties/support/tickets/${id}/assign/`, payload),
  closeTicket: (id: number | string) =>
    api.post(`/properties/support/tickets/${id}/close/`),
  ticketStats: () => api.get('/properties/support/tickets/stats/'),
  fetchSupportTickets: (params?: Params) => api.get('/properties/tickets/', { params }),

  // Agent stats
  fetchAgentStats: () => api.get('/agents/stats/'),
};

export default propertiesService;

