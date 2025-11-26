import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRole } from '@/api/auth';
import { Loader2 } from 'lucide-react';

export default function GuestGuard() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user) {
        const role = getUserRole(user);
        if (role === 'superuser') {
            return <Navigate to="/admin" replace />;
        } else if (role === 'agent') {
            return <Navigate to="/agent" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <Outlet />;
}
