
import NotificationBell from '@/components/ui/NotificationBell';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function DashboardHeader() {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-end gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <LanguageSwitcher />
            <ThemeToggle />
            <NotificationBell />
        </header>
    );
}
