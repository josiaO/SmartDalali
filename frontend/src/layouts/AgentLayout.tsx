import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';

export function AgentLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
