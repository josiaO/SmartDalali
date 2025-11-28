import { useState, ElementType } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Building2,
  LayoutDashboard,
  Home,
  MessageSquare,
  Headphones,
  LogOut,
  Plus,
  User,
  Settings,
  Users,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';

interface NavItem {
  title: string;
  href: string;
  icon: ElementType;
  disabled?: boolean;
  badge?: string;
  roles?: ('admin' | 'agent' | 'user')[];
}

export function DashboardSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Define menu items with role-based visibility
  const menuItems: NavItem[] = [
    {
      title: t('sidebar.dashboard'),
      href: user?.role === 'admin' ? '/admin' : user?.role === 'agent' ? '/agent/dashboard' : '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'agent', 'user'],
    },
    // Admin-specific items
    {
      title: t('sidebar.all_properties'),
      href: '/admin/dashboard?tab=properties',
      icon: Home,
      roles: ['admin'],
    },
    {
      title: t('sidebar.users'),
      href: '/admin/dashboard?tab=users',
      icon: Users,
      roles: ['admin'],
    },
    {
      title: t('admin.manage_features'),
      href: '/admin/features',
      icon: Settings,
      roles: ['admin'],
    },
    // Agent-specific items
    {
      title: t('sidebar.my_properties'),
      href: '/agent/my-properties', // Updated href
      icon: Home,
      roles: ['agent'],
    },
    {
      title: t('sidebar.browse_properties'), // New item
      href: '/agent/properties',
      icon: Search,
      roles: ['agent'],
    },
    {
      title: t('sidebar.profile'),
      href: user?.id ? `/agents/${user.id}/profile` : '#',
      icon: User,
      roles: ['agent'],
    },
    // User-specific items
    {
      title: t('sidebar.browse_properties'),
      href: '/properties',
      icon: Home,
      roles: ['user'],
    },
    // Shared items
    {
      title: t('sidebar.messages'),
      href: '/communication',
      icon: MessageSquare,
      roles: ['admin', 'agent', 'user'], // Roles adjusted, disabled/badge removed
    },
    {
      title: t('sidebar.support'),
      href: '/support',
      icon: Headphones,
      roles: ['admin', 'agent', 'user'],
    },
    {
      title: t('sidebar.settings'),
      href: '/profile',
      icon: Settings,
      roles: ['admin', 'agent', 'user'],
    },
  ];

  // Filter menu items based on user role
  const visibleItems = menuItems.filter(item =>
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6 justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
          {!isCollapsed && <span className="text-lg font-bold">SmartDalali</span>}
        </Link>
        {/* Desktop collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Agent Action Button */}
        {user?.role === 'agent' && (
          <div className="px-3 pb-4">
            <Link to="/properties/create" onClick={onItemClick}>
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-2">{t('sidebar.list_property')}</span>}
              </Button>
            </Link>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.disabled ? '#' : item.href}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                  else onItemClick?.();
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                  item.disabled && 'cursor-not-allowed opacity-50'
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="border-t p-4">
        {!isCollapsed && (
          <>
            <div className="mb-3 px-3">
              <p className="text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <Badge variant="outline" className="mt-1 text-xs">
                {user?.role === 'admin' ? 'Admin' : user?.role === 'agent' ? 'Agent' : 'User'}
              </Badge>
            </div>
            <Separator className="mb-3" />
          </>
        )}
        <Button
          variant="ghost"
          className={cn("w-full", isCollapsed ? "justify-center px-2" : "justify-start")}
          onClick={logout}
          title={isCollapsed ? t('nav.logout') : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && <span className="ml-2">{t('nav.logout')}</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <VisuallyHidden.Root>
                <SheetTitle>Dashboard Menu</SheetTitle>
              </VisuallyHidden.Root>
              <div className="flex h-full flex-col bg-sidebar">
                <SidebarContent onItemClick={() => setIsMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            <span>SmartDalali</span>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent />
      </div>
    </>
  );
}
