import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Eye, FileText, Loader2, Calendar, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLikedProperties, getViewedProperties } from '@/api/properties';
// import { fetchVisits, Visit } from '@/api/visits'; // HIDDEN
import { getSupportTickets } from '@/api/support';
import { useTranslation } from 'react-i18next';
import { BecomeAgentCard } from '@/components/user/BecomeAgentCard';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
// import { SubscriptionTimer } from '@/components/subscription/SubscriptionTimer'; // HIDDEN
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

  // const { data: visitsData, isLoading: loadingVisits } = useQuery({
  //   queryKey: ['user-visits'],
  //   queryFn: fetchVisits,
  // });

  // const visits = visitsData?.results || [];

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
      {/* <SubscriptionTimer /> */}

      {/* Agent Upgrade Card */}
      <BecomeAgentCard />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Link to="/saved-properties">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
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
        </Link>

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

        <Link to="/communication">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.messages')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* TODO: Add unread count from messaging API */}
                -
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.view_all_messages')}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/support">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
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
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
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
      {/* Scheduled Visits Section - HIDDEN */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">{t('dashboard.scheduled_visits') || 'Scheduled Visits'}</CardTitle>
            <Link to="/communication">
              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('dashboard.messages') || 'Messages'}
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingVisits ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {visits && visits.length > 0 ? (
                  visits.slice(0, 5).map((visit: any) => (
                    <div key={visit.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-sm">
                          {visit.property_details?.title || 'Property Visit'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {visit.date} {visit.time}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${visit.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            visit.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {visit.status}
                          </span>
                        </div>
                      </div>
                      <Link to={visit.property ? `/properties/${visit.property}` : '#'}>
                        <Button variant="ghost" size="sm">{t('common.view')}</Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('dashboard.no_visits') || 'No scheduled visits'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div> */}

      <div className="mt-8">
        <RecentlyViewed />
      </div>
    </div>
  );
}
