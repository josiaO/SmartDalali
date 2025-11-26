import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { Users, Settings, CreditCard, Shield, BarChart3, MessageSquare, Star, Home } from 'lucide-react';
import UserManagement from './UserManagement';
import SubscriptionManagement from './SubscriptionManagement';
import AdminFeatures from './Features';
import AdminPlans from './Plans';
import AdminProperties from './Properties';
import Analytics from './Analytics';
import RatingsReviews from './RatingsReviews';

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'analytics';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, features, subscription plans, agent subscriptions, and view analytics
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-2">
            <Home className="h-4 w-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <Settings className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <Shield className="h-4 w-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="ratings" className="gap-2">
            <Star className="h-4 w-4" />
            Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <Analytics />
        </TabsContent>

        <TabsContent value="properties">
          <AdminProperties />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="features">
          <AdminFeatures />
        </TabsContent>

        <TabsContent value="plans">
          <AdminPlans />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="ratings">
          <RatingsReviews />
        </TabsContent>
      </Tabs>
    </div>
  );
}
