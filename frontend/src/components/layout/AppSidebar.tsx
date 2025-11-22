import { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Building2, LogOut, ChevronDown } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
    SidebarFooter,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useUI } from '@/contexts/UIContext';

export interface SidebarItem {
    title: string;
    url: string;
    icon: LucideIcon;
    disabled?: boolean;
    badge?: string;
}

interface AppSidebarProps {
    items: SidebarItem[];
    role: 'user' | 'agent';
}

export function AppSidebar({ items, role }: AppSidebarProps) {
    const { user, logout } = useAuth();
    const { showComingSoon } = useUI();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    const handleItemClick = (item: SidebarItem, e: React.MouseEvent) => {
        if (item.disabled) {
            e.preventDefault();
            showComingSoon();
        }
    };

    return (
        <Sidebar className="border-r">
            {/* Header */}
            <SidebarHeader className="p-4 border-b">
                <NavLink to="/" className="flex items-center gap-3 transition-all hover:opacity-80">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                        <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold text-base">SmartDalali</h2>
                        <p className="text-xs text-muted-foreground">Real Estate</p>
                    </div>
                </NavLink>
            </SidebarHeader>

            {/* Content */}
            <SidebarContent className="flex-1 overflow-y-auto">
                <SidebarGroup className="py-4">
                    <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wide px-4 mb-2">
                        {role === 'agent' ? 'Agent Menu' : 'Menu'}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            onClick={(e) => handleItemClick(item, e)}
                                            className={({ isActive }) =>
                                                `flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg transition-all ${item.disabled
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : isActive
                                                        ? 'bg-primary/15 text-primary font-medium shadow-sm'
                                                        : 'text-foreground hover:bg-muted'
                                                }`
                                            }
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                                <span className="text-sm">{item.title}</span>
                                            </div>
                                            {item.badge && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {item.badge}
                                                </Badge>
                                            )}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer - User Profile */}
            {user && (
                <SidebarFooter className="p-3 border-t bg-muted/30">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-white">
                                {user.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user.profile?.name || user.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate capitalize">
                                {role}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </div>
                    {isUserMenuOpen && (
                        <button
                            onClick={() => {
                                handleLogout();
                                setIsUserMenuOpen(false);
                            }}
                            className="w-full mt-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    )}
                </SidebarFooter>
            )}
        </Sidebar>
    );
}
