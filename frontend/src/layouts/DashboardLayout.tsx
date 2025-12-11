import { Outlet, Navigate } from 'react-router-dom';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';

export function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto lg:pt-0">
        <div className="container mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
