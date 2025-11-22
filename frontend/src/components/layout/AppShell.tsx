import { ReactNode } from 'react';

interface AppShellProps {
    children: ReactNode;
}

/**
 * Main application shell/layout wrapper
 * Provides consistent structure across all pages
 */
export function AppShell({ children }: AppShellProps) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {children}
        </div>
    );
}
