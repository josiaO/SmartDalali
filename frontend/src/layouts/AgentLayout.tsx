import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { GlobalLoading } from '@/components/common/GlobalLoading';

export function AgentLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <GlobalLoading />
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 pt-14 lg:pt-0">
        <div className="container mx-auto px-4 md:px-8 pb-8">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
