import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, DollarSign, Eye, ArrowUpRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAgentStats } from '@/api/properties';
import { useTranslation } from 'react-i18next';

export default function AgentDashboard() {
    const { t } = useTranslation();
    const { data: stats, isLoading } = useQuery({
        queryKey: ['agent-stats'],
        queryFn: getAgentStats,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">{t('dashboard.overview')}</h1>
                <p className="text-muted-foreground">
                    {t('agent.profile')}
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.total_listings')}</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_listings || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.active_listings')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.total_views')}</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_views || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.total_views')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.inquiries')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_inquiries || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.inquiries')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.earnings')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">TZS {stats?.earnings?.toLocaleString() || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('dashboard.earnings')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Recent Viewers */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.recent_viewers')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.recent_viewers?.length > 0 ? (
                                stats.recent_viewers.map((viewer: any) => (
                                    <div key={viewer.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium">{viewer.visitor_name}</p>
                                            <p className="text-sm text-muted-foreground">{viewer.property_title}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(viewer.date).toLocaleDateString()}
                                            </p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${viewer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                viewer.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {viewer.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">{t('common.no_data')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Most Viewed Properties */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.recent_properties')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.most_viewed?.length > 0 ? (
                                stats.most_viewed.map((prop: any) => (
                                    <div key={prop.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        {prop.image ? (
                                            <img src={prop.image} alt={prop.title} className="h-12 w-12 rounded object-cover" />
                                        ) : (
                                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium line-clamp-1">{prop.title}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" /> {prop.view_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" /> {prop.price.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Link to={`/properties/${prop.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">{t('common.no_data')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Most Liked Properties */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.saved_properties')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.most_liked?.length > 0 ? (
                                stats.most_liked.map((prop: any) => (
                                    <div key={prop.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        {prop.image ? (
                                            <img src={prop.image} alt={prop.title} className="h-12 w-12 rounded object-cover" />
                                        ) : (
                                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium line-clamp-1">{prop.title}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    ❤️ {prop.like_count}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3" /> {prop.price.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Link to={`/properties/${prop.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">{t('common.no_data')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
