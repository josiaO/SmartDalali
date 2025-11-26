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
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'analytics';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('admin.admin_panel')}</h1>
        <p className="text-muted-foreground">
          {t('admin.manage_tickets_desc')}
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('dashboard.analytics')}
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Home className="h-4 w-4" />
              {t('admin.manage_properties')}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('admin.manage_users')}
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.manage_features')}
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {t('dashboard.subscription_plans')}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Shield className="h-4 w-4" />
              {t('dashboard.subscription_plans')}
            </TabsTrigger>
            <TabsTrigger value="ratings" className="gap-2">
              <Star className="h-4 w-4" />
              {t('agent.reviews')}
            </TabsTrigger>
          </TabsList>
        </div>

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
