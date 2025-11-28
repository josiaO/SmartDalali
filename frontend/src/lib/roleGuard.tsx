import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserRole } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  requireAnyRole?: UserRole[];
  requireAllRoles?: UserRole[];
  redirectPath?: string; // Optional custom redirect path
}

/**
 * RoleGuard component protects routes based on user roles
 * Aligns with SmartDalali role-based system architecture
 */
export function RoleGuard({
  children,
  requireAnyRole,
  requireAllRoles,
  redirectPath,
}: RoleGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const userRole = user.role;

  // Check if user has required roles
  if (requireAnyRole && !requireAnyRole.includes(userRole)) {
    // Redirect to user's appropriate dashboard
    const dashboardRoute = redirectPath || getDashboardRouteForRole(userRole);
    return <Navigate to={dashboardRoute} replace />;
  }

  if (requireAllRoles && !requireAllRoles.every(role => userRole === role)) {
    // Redirect to user's appropriate dashboard
    const dashboardRoute = redirectPath || getDashboardRouteForRole(userRole);
    return <Navigate to={dashboardRoute} replace />;
  }

  return <>{children}</>;
}

function getDashboardRouteForRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'agent':
      return '/agent/dashboard';
    case 'user':
    default:
      return '/dashboard';
  }
}

export function useHasRole(role: UserRole): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

export function useHasAnyRole(roles: UserRole[]): boolean {
  const { user } = useAuth();
  return user ? roles.includes(user.role) : false;
}

export function useIsAdmin(): boolean {
  return useHasRole('admin');
}

export function useIsAgent(): boolean {
  return useHasRole('agent');
}

export function useIsUser(): boolean {
  return useHasRole('user');
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
