import api from '@/lib/axios';

export interface Visit {
  id: string;
  property: string;
  user: string;
  scheduled_date: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ScheduleVisitData {
  property: string;
  scheduled_date: string;
  notes?: string;
}

export async function fetchVisits() {
  const response = await api.get<{ results: Visit[] }>('/api/v1/properties/visits/');
  return response.data;
}

export async function scheduleVisit(data: ScheduleVisitData) {
  const response = await api.post<Visit>('/api/v1/properties/visits/', data);
  return response.data;
}

export async function updateVisit(id: string, data: Partial<Visit>) {
  const response = await api.patch<Visit>(`/api/v1/properties/visits/${id}/`, data);
  return response.data;
}

export async function deleteVisit(id: string) {
  await api.delete(`/api/v1/properties/visits/${id}/`);
}
