import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser, logout as apiLogout, UserProfile } from '@/api/auth';
import { fetchFeatures, type Feature } from '@/api/subscriptions';

export type UserRole = 'admin' | 'agent' | 'user';
interface FeaturesResponse {
  results: Feature[];
}
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  features: string[];
  hasFeature: (code: string) => boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function initialize() {
      await checkAuth();
      await loadAllFeatures();
      setLoading(false);
    }
    initialize();
  }, []);

  async function loadAllFeatures() {
    try {
      const featuresData = await fetchFeatures();
      const results = Array.isArray(featuresData) ? featuresData : (featuresData as FeaturesResponse).results || [];
      setAllFeatures(results);
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  }

  async function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // No token, no need to set loading to false here, initialize() will do it.
      return;
    }

    try {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
    } catch (err: unknown) {
      console.error('Auth check failed:', err);
      // If token is invalid, clear it
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      if (err instanceof Error) {
        setError(err.message || 'Authentication failed');
      } else {
        setError('Authentication failed');
      }
    }
  }

  async function login(access: string, refresh: string) {
    try {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      await checkAuth();

      // Redirect to role-specific dashboard after successful login
      const userProfile = await getCurrentUser();
      const role = userProfile.role || (userProfile.is_superuser ? 'admin' : userProfile.groups?.includes('agent') ? 'agent' : 'user');

      switch (role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'agent':
          navigate('/agent/dashboard');
          break;
        case 'user':
        default:
          navigate('/dashboard');
          break;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Login failed');
      } else {
        setError('Login failed');
      }
      throw err;
    }
  }

  async function logout() {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    navigate('/auth/login');
    toast.success('Logged out successfully');
  }

  async function refreshUser() {
    setLoading(true);
    await checkAuth();
    await loadAllFeatures();
    setLoading(false);
  }

  const userFeatureCodes = user?.agent_profile?.current_plan?.features || [];

  function hasFeature(code: string): boolean {
    if (user?.is_superuser) return true; // Superusers have all features

    const feature = allFeatures.find(f => f.code === code);
    if (!feature || (feature.status !== 'active' && !feature.is_active)) {
      return false; // Feature does not exist or is inactive globally
    }

    // For agents, check if the feature is in their plan
    if (user?.role === 'agent') {
      return userFeatureCodes.includes(code);
    }

    // For other roles, if they are not superuser, they don't have features from plans
    return false;
  }

  const accessibleFeatures = userFeatureCodes.filter(code => {
    const feature = allFeatures.find(f => f.code === code);
    return feature?.status === 'active' || feature?.is_active;
  });

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        features: user?.is_superuser ? allFeatures.map(f => f.code) : accessibleFeatures,
        hasFeature,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Export useAuth here as well for convenience, though it's also in hooks/useAuth.ts
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
