import api from '@/lib/axios';

export interface Feature {
  id: number;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'coming_soon' | 'disabled';
  is_global: boolean;
}

export interface Plan {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  duration_days: number;
  features: Feature[];
  is_active: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;  // Legacy
  price_monthly?: number;
  price_yearly?: number;
  duration_days: number;
  description: string;
  features: Feature[];
  feature_ids?: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Features - Updated to use correct Django endpoints
export async function fetchFeatures() {
  const response = await api.get<Feature[] | { results: Feature[] }>('/api/v1/features/?page_size=100');
  // Handle both direct array and paginated response
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}

export async function createFeature(data: Partial<Feature>) {
  const response = await api.post<Feature>('/api/v1/features/', data);
  return response.data;
}

export async function updateFeature(id: number, data: Partial<Feature>) {
  const response = await api.patch<Feature>(`/api/v1/features/${id}/`, data);
  return response.data;
}

export async function deleteFeature(id: number) {
  await api.delete(`/api/v1/features/${id}/`);
}

// Plans - Updated to use correct Django endpoints
export async function fetchPlans() {
  const response = await api.get<SubscriptionPlan[] | { results: SubscriptionPlan[] }>('/api/v1/plans/');
  // Handle both direct array and paginated response
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}

export async function createPlan(data: Partial<SubscriptionPlan>) {
  const response = await api.post<SubscriptionPlan>('/api/v1/plans/', data);
  return response.data;
}

export async function updatePlan(id: number, data: Partial<SubscriptionPlan>) {
  const response = await api.patch<SubscriptionPlan>(`/api/v1/plans/${id}/`, data);
  return response.data;
}

export async function deletePlan(id: number) {
  await api.delete(`/api/v1/plans/${id}/`);
}

// Agent Ratings - New endpoints
export interface AgentRating {
  id: number;
  agent: number;
  agent_name: string;
  agent_email: string;
  user: number;
  user_name: string;
  user_email: string;
  rating: number;
  review: string | null;
  property: number | null;
  property_title: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchAgentRatings() {
  const response = await api.get<AgentRating[] | { results: AgentRating[] }>('/api/v1/properties/ratings/');
  // Handle both direct array and paginated response
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}

export async function fetchAgentRatingStats() {
  const response = await api.get('/api/v1/properties/ratings/stats/');
  return response.data;
}

export async function createAgentRating(data: { agent: number; rating: number; review?: string; property?: number }) {
  const response = await api.post<AgentRating>('/api/v1/properties/ratings/', data);
  return response.data;
}
