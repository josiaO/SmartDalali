import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { FirebaseAuthProvider } from "./contexts/FirebaseAuthContext";
import { UIProvider } from "./contexts/UIContext";
import { AuthGuard, GuestGuard, RoleGuard } from "@/lib/roleGuard";
import { PublicLayout } from "@/layouts/PublicLayout";
import { UserLayout } from "@/layouts/UserLayout";
import { AgentLayout } from "@/layouts/AgentLayout";
import { ROLES } from "@/lib/constants";

// Pages
import Index from "@/pages/misc/Index";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Browse from "@/pages/properties/Browse";
import Details from "@/pages/properties/Details";
import Create from "@/pages/properties/Create";
import UserDashboard from "@/pages/dashboard/UserDashboard";
import AgentDashboard from "@/pages/dashboard/AgentDashboard";
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
                </Route>

                {/* Auth Routes (Guest only) */}
                <Route element={<GuestGuard><PublicLayout /></GuestGuard>}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
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
                  <RoleGuard allowedRoles={[ROLES.AGENT]}>
                    <AgentLayout />
                  </RoleGuard>
                }>
                  <Route path="/agent/dashboard" element={<AgentDashboard />} />
                  <Route path="/agent/properties" element={<Browse />} />
                  <Route path="/properties/create" element={<Create />} />
                  <Route path="/properties/:id/edit" element={<Create />} />
                  <Route path="/payments/subscription" element={<Subscription />} />
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
