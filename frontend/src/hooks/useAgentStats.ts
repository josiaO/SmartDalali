import { useQuery } from '@tanstack/react-query';
import { fetchAgentStats } from '@/api/agent';
import { analytics } from '@/lib/firebase'

export interface AgentStats {
  total_listings: number;
  total_views: number;
  total_inquiries: number;
  earnings: number;
  recent_viewers?: Array<{
    id: number;
    visitor_name: string;
    visitor_email: string;
    property_title: string;
    date: string;
    status: string;
  }>;
  recent_reviews?: Array<{
    id: number;
    reviewer_name: string;
    rating: number;
    comment: string;
    property_title: string | null;
    date: string;
  }>;
  most_viewed?: Array<{
    id: number;
    title: string;
    view_count: number;
    price: number;
    image: string | null;
  }>;
  most_liked?: Array<{
    id: number;
    title: string;
    like_count: number;
    price: number;
    image: string | null;
  }>;
}

export function useAgentStats() {
  return useQuery({
    queryKey: ['agent-stats'],
    queryFn: fetchAgentStats,
  });
}
