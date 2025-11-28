import { Outlet } from 'react-router-dom';
import { PublicHeader } from '@/components/layout/PublicHeader';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Real Estate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
