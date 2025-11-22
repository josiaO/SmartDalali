import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/constants';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: string[];
    redirectTo?: string;
}

/**
 * Route guard component that checks if user has required role
 */
export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
    const { user, isLoading } = useAuth();

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    // Check if user has required role
    if (!allowedRoles.includes(user.role)) {
        // Redirect to custom route or user's default dashboard
        const fallback = redirectTo || ROUTES.USER_DASHBOARD;
        return <Navigate to={fallback} replace />;
    }

    return <>{children}</>;
}

/**
 * Guard for routes requiring authentication (any role)
 */
export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return <>{children}</>;
}

/**
 * Guard for public routes (redirects authenticated users to their dashboard)
 */
export function PublicOnlyGuard({ children }: { children: ReactNode }) {
    const { user, isLoading, getDashboardRoute } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (user) {
        const dashboardRoute = getDashboardRoute();
        return <Navigate to={dashboardRoute} replace />;
    }

    return <>{children}</>;
}
