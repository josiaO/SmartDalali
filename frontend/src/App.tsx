import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FirebaseAuthProvider } from "@/contexts/FirebaseAuthContext";
import { UIProvider } from "@/contexts/UIContext";
import { AuthGuard, GuestGuard, RoleGuard } from "@/lib/roleGuard";
import { PublicLayout } from "@/layouts/PublicLayout";
import { UserLayout } from "@/layouts/UserLayout";
import { AgentLayout } from "@/layouts/AgentLayout";
import { USER_ROLES as ROLES } from "@/lib/constants";

// Pages
import Index from "@/pages/Home";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Signup";
import Browse from "@/pages/properties/Browse";
import Details from "@/pages/properties/Details";
import CreateProperty from "@/pages/properties/CreateProperty";
import EditProperty from "@/pages/properties/EditProperty";
import UserDashboard from "@/pages/dashboard/UserDashboard";
import AgentPublicProfile from "@/pages/agent/AgentPublicProfile";
import AdminDashboard from "@/pages/admin/AdminDashboard";

import Tickets from "@/pages/support/Tickets";
import CreateTicket from "@/pages/support/CreateTicket";
import TicketDetail from "@/pages/support/TicketDetail";
import Conversations from "@/pages/communication/Conversations";
import Subscription from "@/pages/payments/Subscription";
import NotFound from "@/pages/misc/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FirebaseAuthProvider>
            <UIProvider>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/properties" element={<Browse />} />
                  <Route path="/properties/:id" element={<Details />} />
                  <Route path="/agents/:agentId" element={<AgentPublicProfile />} />
                </Route>

                {/* Auth Routes (Guest only) */}
                <Route element={<GuestGuard><PublicLayout /></GuestGuard>}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Register />} />
                </Route>

                {/* User Routes (Authenticated) */}
                <Route element={<AuthGuard><UserLayout /></AuthGuard>}>
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/support" element={<Tickets />} />
                  <Route path="/support/create" element={<CreateTicket />} />
                  <Route path="/support/:id" element={<TicketDetail />} />
                  <Route path="/communication" element={<Conversations />} />
                </Route>

                {/* Agent Routes (Agent role only) */}
                <Route element={
                  <RoleGuard requireAnyRole={[ROLES.AGENT]}>
                    <AgentLayout />
                  </RoleGuard>
                }>
                  <Route path="/agent/dashboard" element={<UserDashboard />} />
                  <Route path="/agent/properties" element={<Browse />} />
                  <Route path="/properties/create" element={<CreateProperty />} />
                  <Route path="/properties/:id/edit" element={<EditProperty />} />
                  <Route path="/payments/subscription" element={<Subscription />} />
                </Route>

                {/* Admin Routes (Admin role only) */}
                <Route element={
                  <RoleGuard requireAnyRole={[ROLES.ADMIN]}>
                    <UserLayout />
                  </RoleGuard>
                }>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </UIProvider>
          </FirebaseAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
