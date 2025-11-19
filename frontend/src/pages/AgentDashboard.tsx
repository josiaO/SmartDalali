import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Plus,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  LucideIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import propertiesService from "@/services/properties";
import communicationsService from "@/services/communications";
import { Property } from "@/data/properties";
import { useToast } from "@/hooks/use-toast";

interface AgentStats {
  total_listings: number;
  active_listings: number;
  total_views: number;
  total_inquiries: number;
  pending_payments: number;
  open_tickets: number;
  unread_messages: number;
}

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  first_name?: string;
}

export default function AgentDashboard() {
  const { user } = useAuth() as { user: User | null };
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState<AgentStats | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mock chart data
  const viewsChartData = [
    { date: "Mon", views: 120, inquiries: 40 },
    { date: "Tue", views: 200, inquiries: 60 },
    { date: "Wed", views: 150, inquiries: 50 },
    { date: "Thu", views: 280, inquiries: 90 },
    { date: "Fri", views: 190, inquiries: 70 },
    { date: "Sat", views: 230, inquiries: 85 },
    { date: "Sun", views: 200, inquiries: 75 },
  ];

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Fetch agent properties
      const propsResponse = await propertiesService.fetchListings({
        owner: user.id,
      });
      const propsList = Array.isArray(propsResponse.data)
        ? propsResponse.data
        : propsResponse.data.results || [];
      setProperties(propsList.slice(0, 5));

      // Fetch statistics
      const statsResponse = await propertiesService.fetchAgentStats();
      setStats(statsResponse.data);

      // Fetch support tickets
      const ticketsResponse = await propertiesService.fetchSupportTickets();
      const ticketsList = Array.isArray(ticketsResponse.data)
        ? ticketsResponse.data
        : ticketsResponse.data.results || [];
      setTickets(ticketsList.filter((t: Ticket) => t.status !== "closed").slice(0, 5));

      // Fetch unread messages count
      const convsResponse = await communicationsService.fetchConversations();
      const convsList = Array.isArray(convsResponse.data)
        ? convsResponse.data
        : convsResponse.data.results || [];
      setUnreadMessages(convsList.length);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDeleteProperty = async (id: number) => {
    try {
      await propertiesService.deleteListing(id);
      toast({ title: "Success", description: "Property deleted" });
      fetchDashboardData();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete property", variant: "destructive" });
    }
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    trend,
    loading,
    color = "blue",
  }: {
    icon: LucideIcon;
    title: string;
    value: number | string;
    trend?: number;
    loading: boolean;
    color?: "blue" | "green" | "orange" | "red" | "purple";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200",
      red: "bg-red-50 text-red-600 border-red-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
    };

    return (
      <Card className={`border ${colorClasses[color].split(" ")[2]} hover:shadow-lg transition-shadow`}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-neutral-foreground3Rest font-medium">{title}</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-3xl font-bold text-neutral-foreground1">
                  {loading ? <Skeleton className="h-9 w-20" /> : value}
                </p>
                {trend !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    {Math.abs(trend)}%
                  </div>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color].split(" ")[0]} ${colorClasses[color].split(" ")[1]}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-neutral-fill-rest">
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-foreground1">
              Agent Dashboard
            </h1>
            <p className="text-neutral-foreground3Rest mt-2">
              Welcome back, <span className="font-semibold text-neutral-foreground2Rest">{user?.first_name || user?.username}</span>
            </p>
          </div>
          <Button
            onClick={() => navigate("/properties/new")}
            size="lg"
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </Button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Building2}
            title="Total Listings"
            value={stats?.total_listings ?? "-"}
            trend={12}
            loading={loading}
            color="blue"
          />
          <StatCard
            icon={Eye}
            title="Total Views"
            value={stats?.total_views ?? "-"}
            trend={8}
            loading={loading}
            color="green"
          />
          <StatCard
            icon={DollarSign}
            title="Pending Payments"
            value={stats?.pending_payments ?? "-"}
            trend={-2}
            loading={loading}
            color="orange"
          />
          <StatCard
            icon={MessageSquare}
            title="Unread Messages"
            value={unreadMessages}
            loading={loading}
            color="purple"
          />
        </div>

        {/* Analytics Section */}
        <Card className="border-neutral-stroke2Rest hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Weekly Activity</CardTitle>
            <CardDescription>Views and inquiries over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={viewsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(0,0,0,0.4)" />
                  <YAxis stroke="rgba(0,0,0,0.4)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    name="Views"
                  />
                  <Line
                    type="monotone"
                    dataKey="inquiries"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    name="Inquiries"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="space-y-6">
          <Tabs defaultValue="properties" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-neutral-fill-rest border border-neutral-stroke2Rest">
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                Properties
              </TabsTrigger>
              <TabsTrigger
                value="tickets"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                Support
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                Payments
              </TabsTrigger>
            </TabsList>

            {/* Properties Tab */}
            <TabsContent value="properties" className="space-y-4">
              <Card className="border-neutral-stroke2Rest">
                <CardHeader className="border-b border-neutral-stroke2Rest">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">My Properties</CardTitle>
                      <CardDescription>
                        {loading ? "Loading..." : `${stats?.active_listings} of ${stats?.total_listings} active`}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/agent/listings")}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : properties.length > 0 ? (
                    <div className="space-y-3">
                      {properties.map((prop) => (
                        <div
                          key={prop.id}
                          className="flex items-center justify-between p-4 border border-neutral-stroke2Rest rounded-lg hover:bg-neutral-fill-rest/50 hover:border-blue-300 transition-all"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-neutral-foreground1">{prop.title}</h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-neutral-foreground3Rest">
                              <Calendar className="w-3 h-3" />
                              {prop.city}
                            </div>
                          </div>
                          <div className="text-right mr-4">
                            <p className="font-bold text-neutral-foreground1">TSh {prop.price?.toLocaleString()}</p>
                            <Badge
                              className={`mt-1 ${
                                prop.is_published
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                              }`}
                              variant="outline"
                            >
                              {prop.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-neutral-fill-rest">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/properties/${prop.id}/edit`)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/properties/${prop.id}`)}>
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteProperty(prop.id)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="w-12 h-12 mx-auto text-neutral-foreground3Rest/30 mb-4" />
                      <p className="text-neutral-foreground3Rest font-medium">No properties yet</p>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/properties/new")}
                        className="mt-4 hover:bg-blue-50 hover:text-blue-600"
                      >
                        Create First Property
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support Tickets Tab */}
            <TabsContent value="tickets" className="space-y-4">
              <Card className="border-neutral-stroke2Rest">
                <CardHeader className="border-b border-neutral-stroke2Rest">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Support Tickets</CardTitle>
                      <CardDescription>Open support requests</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/support")}
                      className="hover:bg-blue-50 hover:text-blue-600"
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : tickets.length > 0 ? (
                    <div className="space-y-3">
                      {tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-4 border border-neutral-stroke2Rest rounded-lg hover:bg-neutral-fill-rest/50 transition-all"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            {ticket.status === "open" && (
                              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            )}
                            {ticket.status === "in_progress" && (
                              <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            )}
                            {ticket.status === "resolved" && (
                              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <h3 className="font-semibold text-neutral-foreground1">{ticket.title}</h3>
                              <p className="text-sm text-neutral-foreground3Rest">
                                Created {new Date(ticket.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            className={`${
                              ticket.priority === "high"
                                ? "bg-red-50 text-red-700 hover:bg-red-100"
                                : ticket.priority === "medium"
                                  ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                            variant="outline"
                          >
                            {ticket.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-green-500/30 mb-4" />
                      <p className="text-neutral-foreground3Rest font-medium">No open support tickets</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              <Card className="border-neutral-stroke2Rest">
                <CardHeader className="border-b border-neutral-stroke2Rest">
                  <CardTitle className="text-xl">Pending Payments</CardTitle>
                  <CardDescription>Waiting for confirmation</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 mx-auto text-neutral-foreground3Rest/30 mb-4" />
                    <p className="text-neutral-foreground3Rest font-medium">No pending payments</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
