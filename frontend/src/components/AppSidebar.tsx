import { Home, Building2, LayoutDashboard, Users, Settings, Map, Plus, Shield, MessageSquare, LogOut, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getNavItems = () => {
    const publicItems = [
      { title: "Home", url: "/", icon: Home, badge: null },
      { title: "Properties", url: "/properties", icon: Building2, badge: null },
      { title: "Map View", url: "/map", icon: Map, badge: null },
    ];

    if (user) {
      publicItems.push({ title: "Messages", url: "/messages", icon: MessageSquare, badge: "2" });
    }

    const userItems = [];
    const managementItems = [];

    if (user?.role === "superuser") {
      userItems.push({ title: "Admin Dashboard", url: "/admin", icon: Shield, badge: null });
      managementItems.push(
        { title: "Users Management", url: "/admin/users", icon: Users, badge: null },
        { title: "All Properties", url: "/properties", icon: Building2, badge: null },
        { title: "Settings", url: "/admin/settings", icon: Settings, badge: null }
      );
    } else if (user?.role === "agent") {
      userItems.push({ title: "My Dashboard", url: "/agent", icon: LayoutDashboard, badge: null });
      managementItems.push(
        { title: "My Listings", url: "/agent/listings", icon: Building2, badge: "12" },
        { title: "Messages", url: "/agent/messages", icon: MessageSquare, badge: "3" },
        { title: "Profile", url: "/agent/profile", icon: Settings, badge: null },
        { title: "Add Property", url: "/properties/new", icon: Plus, badge: null }
      );
    } else if (user?.role === "user") {
      userItems.push({ title: "My Dashboard", url: "/dashboard", icon: LayoutDashboard, badge: null });
    }

    return { publicItems, userItems, managementItems };
  };

  const { publicItems, userItems, managementItems } = getNavItems();

  return (
    <Sidebar className="border-r border-neutral-stroke2Rest bg-neutral-layer-floating">
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-neutral-stroke2Rest bg-gradient-to-r from-neutral-background1 to-neutral-background1 hover:from-neutral-fill-rest/5">
        <NavLink to="/" className="flex items-center gap-3 transition-all hover:opacity-80">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-base leading-snug">SmartDalali</h2>
            <p className="text-xs text-neutral-foreground3Rest/70">Real Estate</p>
          </div>
        </NavLink>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="flex-1 overflow-y-auto">
        {/* Public Navigation */}
        <SidebarGroup className="py-4">
          <SidebarGroupLabel className="text-xs font-semibold text-neutral-foreground2Rest uppercase tracking-wide px-4 mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {publicItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg transition-all ${
                          isActive
                            ? "bg-blue-500/15 text-blue-600 font-medium shadow-sm"
                            : "text-neutral-foreground1 hover:bg-neutral-fill-rest"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">{item.title}</span>
                      </div>
                      {item.badge && (
                        <Badge className="h-5 px-1.5 text-xs bg-orange-500/20 text-orange-700 hover:bg-orange-500/30">
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

        {/* User-specific items */}
        {user && userItems.length > 0 && (
          <SidebarGroup className="py-4">
            <SidebarGroupLabel className="text-xs font-semibold text-neutral-foreground2Rest uppercase tracking-wide px-4 mb-2">
              <div className="flex items-center justify-between w-full">
                <span>Dashboard</span>
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {userItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg transition-all ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-600 font-medium shadow-sm"
                              : "text-neutral-foreground1 hover:bg-neutral-fill-rest"
                          }`
                        }
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{item.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize bg-neutral-fill-rest/50">
                          {user.role}
                        </Badge>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Management items */}
        {managementItems.length > 0 && (
          <SidebarGroup className="py-4">
            <SidebarGroupLabel className="text-xs font-semibold text-neutral-foreground2Rest uppercase tracking-wide px-4 mb-2">
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg transition-all ${
                            isActive
                              ? "bg-purple-500/15 text-purple-600 font-medium shadow-sm"
                              : "text-neutral-foreground1 hover:bg-neutral-fill-rest"
                          }`
                        }
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge className="h-5 px-1.5 text-xs bg-red-500/20 text-red-700 hover:bg-red-500/30">
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
        )}
      </SidebarContent>

      {/* Footer - User Profile */}
      {user && (
        <SidebarFooter className="p-3 border-t border-neutral-stroke2Rest bg-neutral-fill-rest/30">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {user.first_name?.charAt(0) || user.username?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-foreground1 truncate">
                {user.first_name || user.username}
              </p>
              <p className="text-xs text-neutral-foreground3Rest truncate">{user.email}</p>
            </div>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-1.5 hover:bg-neutral-fill-rest rounded-md transition-colors"
            >
              <ChevronDown className="h-4 w-4 text-neutral-foreground2Rest" />
            </button>
          </div>
          {isUserMenuOpen && (
            <button
              onClick={() => {
                logout();
                setIsUserMenuOpen(false);
              }}
              className="w-full mt-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
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
