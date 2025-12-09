import { UserProfile } from "@/api/auth";

export type UserRole = 'admin' | 'agent' | 'user';

/**
 * Returns the dashboard path based on the user's role.
 * User -> /dashboard
 * Agent -> /agent/dashboard
 * Admin -> /admin/dashboard
 */
export function getDashboardPath(role: UserRole | string | undefined): string {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'agent':
            return '/agent/dashboard';
        case 'user':
        default:
            // Default to user dashboard for safety, or if role is missing
            return '/dashboard';
    }
}

/**
 * Helper to determine if a user has a specific role or higher privileges if applicable
 * (Though for strict redirects, we just check equality)
 */
export function isRole(user: UserProfile | null, role: UserRole): boolean {
    if (!user) return false;
    return user.role === role;
}
