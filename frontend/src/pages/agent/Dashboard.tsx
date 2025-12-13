import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, TrendingUp, Calendar, DollarSign, Plus, Eye, Heart, MessageSquare, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProperties } from '@/hooks/useProperties';
import { useEffect, useState } from 'react';
import { fetchSubscriptionPlans, type SubscriptionPlan } from '@/api/subscriptions';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { useAgentStats } from '@/hooks/useAgentStats';
import { useTranslation } from 'react-i18next';
import { formatTZS } from '@/lib/currency';

interface SubscriptionPlansResponse {
  results: SubscriptionPlan[];
}

interface RecentViewer {
  id: number;
  visitor_name: string;
  property_title: string;
  status: string;
  date: string;
}

interface RecentReview {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  property_title: string;
  date: string;
}

export default function AgentDashboard() {
  const { data: propertiesData } = useProperties();
  const properties = propertiesData?.results || [];
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const { toast } = useToast();
  const { data: agentStats } = useAgentStats();
  const { t } = useTranslation();

  useEffect(() => {
    async function loadPlans() {
      try {
        const data = await fetchSubscriptionPlans();
        const results = Array.isArray(data) ? data : (data as SubscriptionPlansResponse).results || [];
        setPlans(results.filter(plan => plan.is_active));
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load subscription plans.',
          variant: 'destructive',
        });
      } finally {
        setLoadingPlans(false);
      }
    }
    loadPlans();
  }, [toast]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.overview')}</h1>
          <p className="text-muted-foreground">
            {t('auth.welcome_back')}! Here's your performance summary
          </p>
        </div>
        <Link to="/properties/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('property.add_property')}
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.active_listings')}</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentStats?.total_listings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Properties currently listed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.total_views')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentStats?.total_views || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.this_month')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.inquiries')}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.new_messages')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.visits_scheduled')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.this_week')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.subscription_plans')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No subscription plans are available at the moment.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {plans.map((plan) => (
                <div key={plan.id} className={`border rounded-lg p-6 flex flex-col ${plan.name.toLowerCase().includes('annual') ? 'border-2 border-primary' : ''}`}>
                  <div className="flex-grow">
                    {plan.name.toLowerCase().includes('annual') && (
                      <div className="text-right mb-2">
                        <Badge variant="default">Best Value</Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">TSh {Number(plan.price).toLocaleString()}</span>
                      <span className="text-muted-foreground">/ {plan.duration_days} days</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map(feature => (
                        <li key={feature.id} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-1" />
                          <span>{feature.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link to="/payments/subscription">
                    <Button className="w-full" variant="outline">
                      Choose Plan
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Properties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Properties</CardTitle>
          <Link to="/agent/listings">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {properties.length > 0 ? (
            <div className="space-y-3">
              {properties.slice(0, 5).map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  {property.media?.[0]?.Images && (
                    <img
                      src={property.media[0].Images}
                      alt={property.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{property.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {property.city} • {property.bedrooms} bed • {property.bathrooms} bath
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">TZS {property.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">{property.status.replace('_', ' ')}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                No properties listed yet
              </p>
              <Link to="/properties/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Property
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Viewers */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Viewers</CardTitle>
          </CardHeader>
          <CardContent>
            {agentStats?.recent_viewers && agentStats.recent_viewers.length > 0 ? (
              <div className="space-y-4">
                {agentStats.recent_viewers.map((viewer: RecentViewer) => (
                  <div key={viewer.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{viewer.visitor_name}</p>
                      <p className="text-sm text-muted-foreground">{viewer.property_title}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={viewer.status === 'completed' ? 'default' : 'secondary'}>
                        {viewer.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(viewer.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent viewers
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {agentStats?.recent_reviews && agentStats.recent_reviews.length > 0 ? (
              <div className="space-y-4">
                {agentStats.recent_reviews.map((review: RecentReview) => (
                  <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{review.reviewer_name}</p>
                      <div className="flex items-center">
                        <span className="font-bold mr-1">{review.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      "{review.comment}"
                    </p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{review.property_title}</span>
                      <span>{new Date(review.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent reviews
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Viewed Properties */}
      {agentStats?.most_viewed && agentStats.most_viewed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Most Viewed Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentStats.most_viewed.map((property) => (
                <div key={property.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  {property.image && (
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/properties/${property.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {property.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{formatTZS(property.price)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="font-semibold">{property.view_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Most Liked Properties */}
      {agentStats?.most_liked && agentStats.most_liked.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Most Liked Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentStats.most_liked.map((property) => (
                <div key={property.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  {property.image && (
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/properties/${property.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {property.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">{formatTZS(property.price)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      <span className="font-semibold">{property.like_count}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">likes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
