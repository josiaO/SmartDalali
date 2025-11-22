import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
    const { user, logout, getDashboardRoute } = useAuth();
    const navigate = useNavigate();

    const displayName = user?.profile?.name || user?.username || user?.email || '';
    const initials = displayName.charAt(0).toUpperCase() || 'U';

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="h-14 px-4 flex items-center justify-between">
                {/* Sidebar Trigger */}
                <SidebarTrigger className="mr-2" />

                {/* Right side controls */}
                <div className="flex items-center gap-2 ml-auto">
                    {user && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const path = getDashboardRoute(user);
                                    navigate(path);
                                }}
                                className="hidden md:inline-flex mr-2"
                            >
                                Dashboard
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                                        <Avatar className="w-9 h-9">
                                            <AvatarFallback>{initials}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <div className="px-2 py-2 border-b">
                                        <p className="text-sm font-medium">{displayName}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                        <p className="text-xs text-muted-foreground capitalize mt-1">
                                            Role: {user.role}
                                        </p>
                                    </div>
                                    <DropdownMenuItem
                                        onClick={async () => {
                                            await logout();
                                            navigate('/login');
                                        }}
                                        className="text-destructive cursor-pointer"
                                    >
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
