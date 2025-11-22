import { ReactNode } from 'react';
import { LayoutDashboard, Home, Plus, MessageSquare, HelpCircle, CreditCard } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { FEATURES } from '@/lib/constants';

interface AgentLayoutProps {
    children: ReactNode;
}

const agentSidebarItems = [
    {
        title: 'Dashboard',
        url: '/dashboard/agent',
        icon: LayoutDashboard,
    },
    {
        title: 'My Properties',
        url: '/dashboard/agent/properties',
        icon: Home,
    },
    {
        title: 'Add Property',
        url: '/properties/create',
        icon: Plus,
    },
    {
        title: 'Messages',
        url: '/communication',
        icon: MessageSquare,
        disabled: !FEATURES.MESSAGING_ENABLED,
        badge: FEATURES.MESSAGING_ENABLED ? undefined : 'Soon',
    },
    {
        title: 'Support',
        url: '/support',
        icon: HelpCircle,
    },
    {
        title: 'Subscription',
        url: '/payments/subscription',
        icon: CreditCard,
        disabled: !FEATURES.PAYMENTS_ENABLED,
        badge: FEATURES.PAYMENTS_ENABLED ? undefined : 'Soon',
    },
];

export function AgentLayout({ children }: AgentLayoutProps) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar items={agentSidebarItems} role="agent" />

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
