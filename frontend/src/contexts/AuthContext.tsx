import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import accountsService from "@/services/accounts";
import api from "@/lib/api";

export type UserRole = "superuser" | "agent" | "user";

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_superuser: boolean;
  groups: string[];
  profile: {
    name: string;
    phone_number: string | null;
    address: string | null;
    image: string | null;
  };
  agent_profile?: { // Optional, only if user is an agent
    agency_name: string | null;
    phone: string | null;
    verified: boolean;
    subscription_active: boolean;
    subscription_expires: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  getDashboardRoute: (u?: User | null) => string;
  redirectByRole: (navigate: (to: string, options?: any) => void, u?: User | null) => void;
  setTokensAndFetchProfile?: (access: string, refresh: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        try {
          const { data } = await accountsService.fetchProfile();
          setUser(normalizeUser(data));
        } catch (error) {
          console.error("Error fetching user profile:", error);
          await logout();
        }
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    console.log('AuthContext.login called with email:', email);
    // Clear any previous tokens before logging in
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    try {
      delete api.defaults.headers.common['Authorization'];
    } catch (e) {}
    console.log('Cleared previous tokens from localStorage');

    const { data: tokens } = await accountsService.login(email, password);
    // store tokens and immediately set axios default header to avoid races
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);
    if (tokens.access) {
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    }
    // Log token prefixes (not full tokens) to help debug mismatches
    console.log('Auth login tokens set:', { access: tokens.access?.slice(0, 8), refresh: tokens.refresh?.slice(0, 8) });
    console.log('localStorage after save:', {
      access: localStorage.getItem('access_token')?.slice(0, 8),
      refresh: localStorage.getItem('refresh_token')?.slice(0, 8),
    });
    console.log('axios default Authorization header:', api.defaults.headers.common['Authorization']?.slice(0, 20));

    // Fetch profile using the exact access token returned by login to avoid
    // any race with interceptors or stale headers.
    console.log('About to fetch profile with explicit header...');
    const { data: user } = await api.get('/accounts/me/', {
      headers: { Authorization: `Bearer ${tokens.access}` },
    }).then((r) => {
      console.log('Profile fetch succeeded with token header set explicitly');
      return r;
    }).catch((e) => { throw e; });
    const normalized = normalizeUser(user);

    // Safety: ensure the fetched profile matches the credentials used to login.
    // If they don't match, clear tokens to avoid session leakage and surface an error.
    if (normalized.email && normalized.email.toLowerCase() !== email.toLowerCase()) {
      console.error('Login detected token/profile mismatch:', {
        loginEmail: email,
        profileEmail: normalized.email,
      });
      // Clear tokens and axios header to ensure we don't continue using a bad session
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      try {
        delete api.defaults.headers.common['Authorization'];
      } catch (e) {}
      throw new Error('Profile email does not match login credentials. Authentication aborted.');
    }

    setUser(normalized);
    return normalized;
  };

  // Compute the dashboard route for a user (used across the app)
  const getDashboardRoute = (u: User | null = user) => {
    if (!u) return "/login";
    switch (u.role) {
      case "superuser":
        return "/admin";
      case "agent":
        return "/agent";
      case "user":
      default:
        return "/dashboard";
    }
  };

  // Helper that redirects using a provided navigate function according to role
  const redirectByRole = (navigate: (to: string, options?: any) => void, u: User | null = user) => {
    const path = getDashboardRoute(u);
    navigate(path, { replace: true });
  };

  // Save tokens to localStorage and fetch the user's profile to initialize auth state
  const setTokensAndFetchProfile = async (access: string, refresh: string) => {
    try {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      if (access) api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      console.log('setTokensAndFetchProfile: tokens set, fetching profile');
      // Use the provided access token explicitly for the profile fetch to
      // avoid any chance of the wrong Authorization header being used.
      const { data } = await api.get('/accounts/me/', {
        headers: { Authorization: `Bearer ${access}` },
      }).then((r) => r).catch((e) => { throw e; });
      const normalized = normalizeUser(data);
      setUser(normalized);
      return normalized;
    } catch (error) {
      console.error("Failed to fetch profile after setting tokens:", error);
      return null;
    }
  };

  // Normalize backend user payload into the frontend User shape used across the app
  function normalizeUser(data: any): User {
    console.log("Raw backend user data:", JSON.stringify(data, null, 2));
    
    // Debug: check groups structure
    console.log("data.groups:", data.groups);
    console.log("typeof data.groups:", typeof data.groups);
    console.log("Array.isArray(data.groups):", Array.isArray(data.groups));
    
    // Check if agent using multiple methods
    const groupsArray = Array.isArray(data.groups) ? data.groups : [];
    console.log("groupsArray:", groupsArray);
    console.log("groupsArray.includes('agent'):", groupsArray.includes("agent"));
    
    // Also check role field from backend (if provided)
    const roleFromBackend = data.role;
    console.log("data.role (from backend):", roleFromBackend);
    
    // Determine role: prefer backend's calculated role if available, otherwise calculate
    let assignedRole: UserRole;
    if (roleFromBackend === "superuser" || roleFromBackend === "agent" || roleFromBackend === "user") {
      // Backend already computed the role, use it
      assignedRole = roleFromBackend as UserRole;
      console.log("Using role from backend:", assignedRole);
    } else {
      // Fall back to computing from is_superuser and groups
      const isAgent = groupsArray.includes("agent");
      assignedRole = data.is_superuser
          ? "superuser"
          : isAgent
          ? "agent"
          : "user";
      console.log("Computed role from is_superuser and groups:", assignedRole);
    }
    
    console.log("Final assigned role:", assignedRole);
    
    return {
      id: data.id,
      username: data.username || data.email?.split("@")[0] || "",
      email: data.email || "",
      role: assignedRole,
      is_superuser: !!data.is_superuser,
      groups: data.groups || [],
      profile: {
        name: data.profile?.name || data.name || data.username || "",
        phone_number: data.profile?.phone_number || null,
        address: data.profile?.address || null,
        image: data.profile?.image || null,
      },
      ...(assignedRole === "agent" && data.agent_profile ? {
        agent_profile: {
          agency_name: data.agent_profile.agency_name || null,
          phone: data.agent_profile.phone || null,
          verified: data.agent_profile.verified || false,
          subscription_active: data.agent_profile.subscription_active || false,
          subscription_expires: data.agent_profile.subscription_expires || null,
        }
      } : {})
    } as User;
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    const accessToken = localStorage.getItem("access_token");
    
    if (refreshToken) {
      try {
        // Only attempt server logout if we have a valid access token
        // (logout endpoint requires IsAuthenticated)
        if (accessToken) {
          await accountsService.logout(refreshToken);
        }
      } catch (error: any) {
        // Ignore 403 Forbidden errors (happens when token is already invalid)
        // Ignore network errors (server might be down)
        if (error.response?.status !== 403) {
          console.warn("Logout warning (non-blocking):", error?.message);
        }
      }
    }
    
    // Always clear tokens from localStorage regardless of server response
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    
    // Remove default header to avoid accidentally sending old tokens
    try {
      delete api.defaults.headers.common['Authorization'];
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, getDashboardRoute, redirectByRole, setTokensAndFetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}