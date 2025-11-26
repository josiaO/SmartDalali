import api from '@/lib/axios';

// Mock test users for development (aligned with Django backend structure)
const MOCK_USERS = {
  'user@test.com': {
    id: 'mock-user-1',
    email: 'user@test.com',
    password: 'user123',
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    is_staff: false,
    is_superuser: false,
    groups: [],
    role: 'user',
    profile: {
      id: 'mock-profile-1',
      user_id: 'mock-user-1',
      name: 'Test User',
      phone_number: '+255123456789',
      address: 'Dar es Salaam, Tanzania',
      code: 'USR001'
    }
  },
  'agent@test.com': {
    id: 'mock-agent-1',
    email: 'agent@test.com',
    password: 'agent123',
    first_name: 'Test',
    last_name: 'Agent',
    username: 'testagent',
    is_staff: false,
    is_superuser: false,
    groups: ['agent'],
    role: 'agent',
    profile: {
      id: 'mock-profile-2',
      user_id: 'mock-agent-1',
      name: 'Test Agent',
      phone_number: '+255987654321',
      address: 'Dar es Salaam, Tanzania',
      code: 'AGT001'
    },
    agent_profile: {
      id: 'mock-agent-profile-1',
      user_id: 'mock-agent-1',
      profile_id: 'mock-profile-2',
      agency_name: 'Test Real Estate Agency',
      phone: '+255987654321',
      verified: true,
      subscription_active: true,
      subscription_expires: '2025-12-31'
    }
  },
  'admin@test.com': {
    id: 'mock-admin-1',
    email: 'admin@test.com',
    password: 'admin123',
    first_name: 'Test',
    last_name: 'Admin',
    username: 'testadmin',
    is_staff: true,
    is_superuser: true,
    groups: [],
    role: 'admin',  // Changed from 'superuser' to match backend
    profile: {
      id: 'mock-profile-3',
      user_id: 'mock-admin-1',
      name: 'Test Admin',
      phone_number: '+255111222333',
      address: 'Dar es Salaam, Tanzania',
      code: 'ADM001'
    }
  }
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[]; // Django groups (e.g., ['agent'])
  role: 'admin' | 'agent' | 'user'; // Computed role from backend - MUST match backend values
  profile?: {
    id: string;
    user_id: string;
    name: string;
    phone_number: string;
    address: string;
    image?: string;
    code: string;
  };
  agent_profile?: {
    id: string;
    user_id: string;
    profile_id: string;
    agency_name: string;
    phone: string;
    verified: boolean;
    subscription_active: boolean;
    subscription_expires: string;
    current_plan?: {
      id: number;
      name: string;
      features: string[]; // List of feature codes
    };
  };
}

export async function login(credentials: LoginCredentials) {
  // Check if it's a mock user first
  const mockUser = MOCK_USERS[credentials.email as keyof typeof MOCK_USERS];
  if (mockUser && mockUser.password === credentials.password) {
    // Return mock tokens
    return {
      access: `mock-access-token-${mockUser.id}`,
      refresh: `mock-refresh-token-${mockUser.id}`
    };
  }

  // Otherwise, try real backend
  const response = await api.post<AuthResponse>('/api/v1/accounts/auth/token/', credentials);
  return response.data;
}

export async function register(data: RegisterData) {
  const response = await api.post('/api/v1/accounts/auth/register/', data);
  return response.data;
}

export async function getCurrentUser(): Promise<UserProfile> {
  // Check if using mock token
  const token = localStorage.getItem('access_token');
  if (token?.startsWith('mock-access-token-')) {
    const userId = token.replace('mock-access-token-', '');
    const mockUser = Object.values(MOCK_USERS).find(u => u.id === userId);
    if (mockUser) {
      const { password, ...userProfile } = mockUser;
      return userProfile as UserProfile;
    }
  }

  const response = await api.get<UserProfile>('/api/v1/accounts/me/');
  return response.data;
}

export function getUserRole(user: UserProfile): 'admin' | 'agent' | 'user' {
  // Use backend's pre-computed role if available (source of truth)
  if (user.role) {
    return user.role;
  }

  // Fallback: Compute from Django flags and groups
  // Backend returns 'admin' for superusers, not 'superuser'
  if (user.is_superuser) {
    return 'admin';
  }

  if (user.groups?.includes('agent')) {
    return 'agent';
  }

  return 'user';
}

export function hasRole(user: UserProfile | null, role: 'admin' | 'agent' | 'user'): boolean {
  if (!user) return false;
  return getUserRole(user) === role;
}

export async function logout() {
  try {
    await api.post('/api/v1/accounts/auth/logout/');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

export async function firebaseLogin(idToken: string, email?: string | null, displayName?: string | null, uid?: string) {
  const response = await api.post<AuthResponse>('/api/v1/accounts/firebase-login/', {
    firebase_token: idToken,
    firebase_uid: uid,
    email: email,
    display_name: displayName
  });
  return response.data;
}
