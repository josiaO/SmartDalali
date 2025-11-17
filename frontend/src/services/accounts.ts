import api from '@/lib/api';

export const accountsService = {
  // Auth
  login: (email: string, password: string) =>
    api.post('/accounts/auth/token/', { email, password }),
  refresh: (refresh: string) =>
    api.post('/accounts/auth/token/refresh/', { refresh }),
  register: (payload: { username: string; email: string; password: string; is_agent?: boolean }) =>
    api.post('/accounts/auth/register/', payload),
  logout: (refresh: string) =>
    api.post('/accounts/auth/logout/', { refresh }),

  // Profile
  fetchProfile: () => api.get('/accounts/me/'),
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/accounts/profile/update/', data),

  // Admin / management
  fetchUsers: (params?: Record<string, unknown>) =>
    api.get('/accounts/users/', { params }),
  fetchUserStats: () => api.get('/accounts/users/stats/'),
  toggleActiveStatus: (userId: number) =>
    api.post(`/accounts/users/${userId}/toggle_active_status/`),
  toggleAgentStatus: (userId: number) =>
    api.post(`/accounts/users/${userId}/toggle_agent_status/`),
  verifyAgent: (profileId: number) =>
    api.post(`/accounts/agent-profiles/${profileId}/verify_agent/`),
  activateAgentSubscription: (profileId: number) =>
    api.post(`/accounts/agent-profiles/${profileId}/activate_subscription/`),
};

export default accountsService;


