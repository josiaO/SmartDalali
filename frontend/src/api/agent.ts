import api from '@/lib/axios';

export interface AgentStats {
  total_listings: number;
  total_views: number;
  total_inquiries: number;
  earnings: number;
}

export async function fetchAgentStats(): Promise<AgentStats> {
  const response = await api.get<AgentStats>('/api/v1/properties/agent-stats/');
  return response.data;
}
