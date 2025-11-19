import api from '@/lib/api';

export type AgentRole = 'user' | 'agent' | 'superuser';

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface ProfileDetails {
  name?: string | null;
  phone_number?: string | null;
  address?: string | null;
  image?: string | null;
}

export interface AgentProfileInfo {
  id: number;
  agency_name: string | null;
  phone: string | null;
  verified: boolean;
  subscription_active: boolean;
  subscription_expires: string | null;
}

export interface AgentStats {
  total_listings: number;
  total_views: number;
  total_inquiries: number;
  earnings: number;
}

export interface AgentProfileData extends UserSummary {
  role: AgentRole;
  is_agent: boolean;
  is_superuser: boolean;
  groups: string[];
  profile: ProfileDetails | null;
  agent_profile: AgentProfileInfo | null;
  user: UserSummary;
}

type AgentProfileUpdatePayload = {
  user?: Partial<UserSummary>;
  profile?: Partial<ProfileDetails>;
  agent_profile?: Partial<AgentProfileInfo>;
  [key: string]: unknown;
};

export const agentService = {
  getProfile: () => api.get<AgentProfileData>('/accounts/me/'),

  updateProfile: (data: Partial<AgentProfileUpdatePayload>) =>
    api.put('/accounts/me/', data),

  getStats: () => api.get<AgentStats>('/agents/stats/'),

  updateProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append('profile.image', file);
    formData.append('image', file);
    return api.patch('/accounts/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default agentService;
