import { useState, lazy, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Plus, TrendingUp, DollarSign, Calendar, Building2, Eye, BarChart3, MessageSquare, Clock, CheckCircle2, Target, Home, Settings, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyCard } from "@/components/PropertyCard";
import { Property } from "@/data/properties"; // Import the updated Property interface
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MpesaPaymentForm } from "@/components/MpesaPaymentForm";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import propertiesService from "@/services/properties";
import { Skeleton } from "@/components/ui/skeleton";
import agentService from "@/services/agent";
import { AgentProfile } from "@/pages/AgentProfile";
import { AgentMessages } from "@/pages/AgentMessages";

function AgentOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");
  const [agentProperties, setAgentProperties] = useState<Property[]>([]);
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  const [annualPrice, setAnnualPrice] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [earnings, setEarnings] = useState(0); // Assuming this is part of agent stats from backend
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!user?.id) return;

      // Fetch agent properties
      setLoadingProperties(true);
      try {
        const propertyResponse = await propertiesService.fetchListings({ owner: user.id, is_published: true });
        const list: Property[] = Array.isArray(propertyResponse.data)
          ? propertyResponse.data
          : propertyResponse.data.results || [];
        setAgentProperties(list);
        const aggregatedViews = list.reduce((sum: number, p: Property) => sum + (p.view_count || 0), 0);
        setTotalViews(aggregatedViews);
      } catch (err) {
        setPropertiesError("Failed to load agent properties.");
        console.error(err);
      } finally {
        setLoadingProperties(false);
      }

      // Fetch agent stats (views, inquiries, earnings)
      try {
        const statsResponse = await agentService.getStats();
        const data = statsResponse.data;
        if (typeof data.total_views === "number") {
          setTotalViews(data.total_views);
        }
        if (typeof data.total_inquiries === "number") {
          setTotalInquiries(data.total_inquiries);
        } else {
          setTotalInquiries(0);
        }
        if (typeof data.earnings === "number") {
          setEarnings(data.earnings);
        } else {
          setEarnings(0);
        }
      } catch (err) {
        console.error("Failed to load agent stats", err);
      }

      // Fetch subscription plans
      setLoadingPlans(true);
      try {
        const plansResponse = await propertiesService.fetchSubscriptionPlans();
        setMonthlyPrice(plansResponse.data.monthly?.price || 0);
        setAnnualPrice(plansResponse.data.annual?.price || 0);
      } catch (err) {
        setPlansError("Failed to load subscription plans.");
        console.error(err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchAgentData();
  }, [user?.id]);

  const stats = [
    {
      title: "Total Listings",
      value: loadingProperties ? <Skeleton className="h-6 w-12" /> : agentProperties.length.toString(),
      icon: Building2,
      color: "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20",
      iconColor: "text-primary",
    },
    {
      title: "Total Views",
      value: loadingProperties ? <Skeleton className="h-6 w-12" /> : totalViews.toLocaleString(),
      icon: Eye,
      color: "bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20",
      iconColor: "text-blue-500",
    },
    {
      title: "Inquiries",
      value: loadingProperties ? <Skeleton className="h-6 w-12" /> : totalInquiries.toString(),
      icon: TrendingUp,
      color: "bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20",
      iconColor: "text-green-500",
    },
    {
      title: "Earnings",
      value: loadingProperties ? <Skeleton className="h-6 w-12" /> : `TSh ${earnings.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20",
      iconColor: "text-orange-500",
    },
  ];

  const handleUpgrade = (plan: "monthly" | "annual") => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    // Optionally refetch user data to update subscription status
    // checkUser(); // If checkUser is exposed or can be called
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border rounded-lg p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Agent Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, <span className="font-semibold text-foreground">{user?.username || "Agent"}</span></p>
          </div>
          <Button className="gap-2" onClick={() => navigate("/properties/new")} size="lg">
            <Plus className="w-5 h-5" />
            Add Property
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`${stat.color} border hover:shadow-lg transition-all`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-full bg-background/50">
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance & Goals Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Goals */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              Monthly Goals
            </CardTitle>
            <CardDescription>Your performance this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Listings Target</span>
                <span className="text-sm text-muted-foreground">5/10</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: '50%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Inquiries Target</span>
                <span className="text-sm text-muted-foreground">35/50</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: '70%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Commission Target</span>
                <span className="text-sm text-muted-foreground">80%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: '80%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded bg-background/50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm">Properties Listed</span>
              </div>
              <span className="font-semibold">3</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-background/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span className="text-sm">New Inquiries</span>
              </div>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-background/50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Property Views</span>
              </div>
              <span className="font-semibold">284</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loadingPlans ? (
          <>
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-[250px] w-full" />
          </>
        ) : plansError ? (
          <p className="text-red-500">{plansError}</p>
        ) : (
          <>
            <Card className="border-primary shadow-lg shadow-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Monthly Plan</CardTitle>
                  <Badge>Popular</Badge>
                </div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-3xl font-bold">TSh {monthlyPrice.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Unlimited property listings
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Priority customer support
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Advanced analytics
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade("monthly")}
                >
                  Subscribe Monthly
                </Button>
              </CardContent>
            </Card>

            <Card className="border-orange-500 shadow-lg shadow-orange-500/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Annual Plan</CardTitle>
                  <Badge variant="secondary">Save 17%</Badge>
                </div>
                <CardDescription>Best value for serious agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="text-3xl font-bold">TSh {annualPrice.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    per year (TSh {Math.round(annualPrice / 12).toLocaleString()}/month)
                  </div>
                </div>
                <ul className="space-y-2 mb-4 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Everything in Monthly plan
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    2 months free
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Featured listings priority
                  </li>
                </ul>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700" 
                  onClick={() => handleUpgrade("annual")}
                >
                  Subscribe Annually
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* My Listings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Listings</CardTitle>
              <CardDescription>Manage your property listings</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/agent/listings")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : propertiesError ? (
            <p className="text-red-500">{propertiesError}</p>
          ) : agentProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentProperties.slice(0, 3).map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
              <p className="text-muted-foreground mb-4">
                Start adding properties to reach potential buyers
              </p>
              <Button onClick={() => navigate("/properties/new")}>Add Your First Property</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Subscribe to {selectedPlan === "monthly" ? "Monthly" : "Annual"} Plan
            </DialogTitle>
            <DialogDescription>
              Choose your payment method to complete subscription
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="mpesa" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="stripe">Card</TabsTrigger>
            </TabsList>
            <TabsContent value="mpesa" className="mt-4">
              <MpesaPaymentForm
                amount={selectedPlan === "monthly" ? monthlyPrice : annualPrice}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentDialog(false)}
              />
            </TabsContent>
            <TabsContent value="stripe" className="mt-4">
              <StripePaymentForm
                amount={selectedPlan === "monthly" ? monthlyPrice : annualPrice}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setShowPaymentDialog(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AgentDashboard() {
  const AgentListings = lazy(() => import("@/pages/AgentListings"));
  
  return (
    <Routes>
      <Route index element={<AgentOverview />} />
      <Route path="listings" element={<AgentListings />} />
      <Route path="messages" element={<AgentMessages />} />
      <Route path="profile" element={<AgentProfile />} />
    </Routes>
  );
}
