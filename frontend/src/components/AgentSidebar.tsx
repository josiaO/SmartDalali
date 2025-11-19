import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, Building2, Mail, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransition } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export function AgentSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navItems: NavItem[] = [
    { label: "Overview", path: "/agent", icon: <Home className="w-5 h-5" /> },
    { label: "My Properties", path: "/agent/listings", icon: <Building2 className="w-5 h-5" /> },
    { label: "Messages", path: "/agent/messages", icon: <Mail className="w-5 h-5" /> },
    { label: "Profile", path: "/agent/profile", icon: <Settings className="w-5 h-5" /> },
  ];

  const handleNavigation = (path: string) => {
    startTransition(() => {
      navigate(path);
      setIsOpen(false);
    });
  };

  const handleLogout = () => {
    startTransition(() => {
      logout();
      navigate("/login");
    });
  };

  const isActive = (path: string) => {
    if (path === "/agent") {
      return location.pathname === "/agent";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-br from-primary/5 to-accent/5 border-r border-border/50 h-full fixed left-0 top-0 pt-20 z-40">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-base",
                isActive(item.path) && "bg-primary/10 text-primary font-semibold"
              )}
              onClick={() => handleNavigation(item.path)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>
        <div className="px-4 pb-6 border-t pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="fixed right-4 top-4 z-50">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <nav className="flex flex-col h-full pt-20">
            <div className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-base",
                    isActive(item.path) && "bg-primary/10 text-primary font-semibold"
                  )}
                  onClick={() => handleNavigation(item.path)}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </div>
            <div className="px-4 pb-6 border-t pt-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
