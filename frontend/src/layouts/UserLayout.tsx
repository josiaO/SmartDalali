import { ReactNode } from 'react';
import { Home, Heart, HelpCircle, User, Menu } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';

interface UserLayoutProps {
    children: ReactNode;
}

const userSidebarItems = [
    {
        title: 'Browse Properties',
        url: '/properties',
        icon: Home,
    },
    {
        title: 'Saved Properties',
        url: '/dashboard/user/saved',
        icon: Heart,
    },
    {
        title: 'Support',
        url: '/support',
        icon: HelpCircle,
    },
    {
        title: 'Profile',
        url: '/dashboard/user/profile',
        icon: User,
    },
];

export function UserLayout({ children }: UserLayoutProps) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar items={userSidebarItems} role="user" />

                <div className="flex-1 flex flex-col">
                    <Header />

                    <main className="flex-1 p-6 lg:p-8">
                        <div className="max-w-screen-xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}
