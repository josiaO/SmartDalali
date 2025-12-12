import api from '@/lib/axios';

export interface Visit {
  id: number;
  property: number;
  user: number;
  agent: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  user_details?: {
    username: string;
    email: string;
    phone_number?: string;
  };
  agent_details?: {
    username: string;
    email: string;
    agency_name?: string;
  };
  property_details?: {
    title: string;
    image?: string;
    price: string;
    city: string;
    location?: string;
  };
}

export interface ScheduleVisitData {
  property: number;
  agent?: number; // Optional if property has owner
  date: string;
  time: string;
  notes?: string;
}

export async function fetchVisits() {
  const response = await api.get<{ results: Visit[] }>('/api/v1/properties/visits/');
  return response.data.results || response.data;
}

export async function scheduleVisit(data: ScheduleVisitData) {
  const response = await api.post<Visit>('/api/v1/properties/visits/', data);
  return response.data;
}

export async function updateVisitStatus(id: number, status: string) {
  const response = await api.post<Visit>(`/api/v1/properties/visits/${id}/status/`, { status });
  return response.data;
}

export async function deleteVisit(id: number) {
  await api.delete(`/api/v1/properties/visits/${id}/`);
}
