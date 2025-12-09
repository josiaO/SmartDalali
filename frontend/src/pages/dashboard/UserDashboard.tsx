import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Eye, FileText, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLikedProperties, getViewedProperties } from '@/api/properties';
import { getSupportTickets } from '@/api/support';
import { useTranslation } from 'react-i18next';
import { BecomeAgentCard } from '@/components/user/BecomeAgentCard';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { SubscriptionTimer } from '@/components/subscription/SubscriptionTimer';
import { RecentlyViewed } from '@/components/properties/RecentlyViewed';

export default function UserDashboard() {
  const { t } = useTranslation();
  const { data: likedProperties, isLoading: loadingLiked } = useQuery({
    queryKey: ['liked-properties'],
    queryFn: getLikedProperties,
  });

  const { data: viewedProperties, isLoading: loadingViewed } = useQuery({
    queryKey: ['viewed-properties'],
    queryFn: getViewedProperties,
  });

  const { data: tickets, isLoading: loadingTickets } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: getSupportTickets,
  });

  const isLoading = loadingLiked || loadingViewed || loadingTickets;

  return (
    <div className="space-y-8">
      {/* Onboarding Modal */}
      <OnboardingModal />

      <div>
        <h1 className="text-3xl font-bold mb-2">{t('dashboard.my_dashboard')}</h1>
        <p className="text-muted-foreground">
          {t('dashboard.user_manage_desc')}
        </p>
      </div>

      {/* Subscription Timer */}
      <SubscriptionTimer />

      {/* Agent Upgrade Card */}
      <BecomeAgentCard />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.saved_properties')}</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingLiked ? <Loader2 className="h-4 w-4 animate-spin" /> : likedProperties?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.saved_desc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.property_views')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingViewed ? <Loader2 className="h-4 w-4 animate-spin" /> : viewedProperties?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.viewed_desc')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('sidebar.support')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingTickets ? <Loader2 className="h-4 w-4 animate-spin" /> : tickets?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.open_tickets')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quick_actions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/properties">
              <Button className="w-full" variant="outline">
                {t('sidebar.browse_properties')}
              </Button>
            </Link>
            <Link to="/support">
              <Button className="w-full" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                {t('sidebar.support')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recent_activity')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {viewedProperties && viewedProperties.length > 0 ? (
                  viewedProperties.slice(0, 3).map((property) => (
                    <div key={property.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{property.title}</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.viewed_recently')}</p>
                      </div>
                      <Link to={`/properties/${property.id}`}>
                        <Button variant="ghost" size="sm">{t('common.view')}</Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('dashboard.no_activity')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <RecentlyViewed />
      </div>
    </div>
  );
}
