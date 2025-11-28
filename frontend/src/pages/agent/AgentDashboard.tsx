import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    BarChart3, Users, DollarSign, Eye, ArrowUpRight, Loader2,
    Building2, MessageSquare, TrendingUp, Plus, Settings, Heart,
    Sparkles, Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAgentStats } from '@/api/properties';
import { getDashboardInsights } from '@/api/insights';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function AgentDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['agent-stats'],
        queryFn: getAgentStats,
    });

    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ['dashboard-insights'],
        queryFn: getDashboardInsights,
    });

    const isLoading = statsLoading || insightsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const kpiItems = [
        {
            key: "listings",
            label: t('dashboard.total_listings'),
            value: stats?.total_listings || 0,
            icon: Home,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
        },
        {
            key: "views",
            label: t('dashboard.total_views'),
            value: insights?.kpis.total_views || stats?.total_views || 0,
            icon: Eye,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400"
        },
        {
            key: "inquiries",
            label: t('dashboard.inquiries'),
            value: insights?.kpis.total_leads || stats?.total_inquiries || 0,
            icon: Users,
            color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
        },
        {
            key: "earnings",
            label: t('dashboard.earnings'),
            value: `TZS ${stats?.earnings?.toLocaleString() || 0}`,
            icon: DollarSign,
            color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400"
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.overview')}</h1>
                    <p className="text-muted-foreground mt-1">
                        {t('dashboard.welcome_back')}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-right">
                        <div>
                            <div className="text-sm font-medium">{user?.first_name} {user?.last_name}</div>
                            <div className="text-xs text-muted-foreground">{user?.email}</div>
                        </div>
                        <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {user?.first_name?.[0]}{user?.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <Link to="/properties/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            {t('dashboard.add_property')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Bar + AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kpiItems.map((item) => (
                        <Card key={item.key} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className={`p-3 rounded-xl ${item.color}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                                    <h3 className="text-2xl font-bold mt-1">{item.value}</h3>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* AI Insights */}
                <Card className="h-full border-primary/20 bg-primary/5 dark:bg-primary/10">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-base">{t('dashboard.ai_assistant')}</CardTitle>
                                    <CardDescription className="text-xs">{t('dashboard.ai_desc')}</CardDescription>
                                </div>
                            </div>
                            <Badge variant="secondary" className="bg-background/50">{t('dashboard.pro')}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {insights?.ai_insights?.map((insight, index) => (
                                <li key={index} className="flex gap-3 text-sm">
                                    <div className="min-w-[4px] rounded-full bg-primary/40" />
                                    <span className="text-muted-foreground">{insight}</span>
                                </li>
                            )) || (
                                    <li className="text-sm text-muted-foreground">No insights available yet.</li>
                                )}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Listings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">{t('dashboard.traffic_trend')}</CardTitle>
                                    <CardDescription>{t('dashboard.traffic_desc')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {insights?.chart_data && insights.chart_data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={insights?.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(val) => new Date(val).getDate().toString()}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="views"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{ r: 4 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="leads"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                    <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                                    <p className="text-sm font-medium">{t('dashboard.no_traffic')}</p>
                                    <p className="text-xs mt-1">{t('dashboard.start_listing')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-base">{t('dashboard.most_viewed')}</CardTitle>
                            <CardDescription>{t('dashboard.top_performing')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats?.most_viewed?.slice(0, 4).map((prop: any) => (
                                    <div key={prop.id} className="flex items-center gap-3">
                                        {prop.image ? (
                                            <img src={prop.image} alt={prop.title} className="h-10 w-10 rounded-lg object-cover bg-muted" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{prop.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{prop.view_count} views</span>
                                                <span>•</span>
                                                <span>TZS {(prop.price / 1000000).toFixed(1)}M</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                                {Math.min(99, 40 + prop.view_count * 2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {!stats?.most_viewed?.length && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Building2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">{t('dashboard.no_listings')}</p>
                                        <Link to="/properties/create">
                                            <Button variant="link" size="sm" className="mt-1 h-auto p-0">
                                                {t('dashboard.create_first')}
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{t('dashboard.recent_activity')}</CardTitle>
                                <Button variant="ghost" size="sm" className="text-xs">{t('dashboard.view_all')}</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats?.recent_viewers?.slice(0, 3).map((viewer: any) => (
                                    <div key={viewer.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback>{viewer.visitor_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                <span className="font-medium">{viewer.visitor_name}</span> viewed <span className="font-medium">{viewer.property_title}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(viewer.date).toLocaleDateString()} • {viewer.status}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {!stats?.recent_viewers?.length && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">{t('dashboard.no_recent_activity')}</p>
                                        <p className="text-xs mt-1">{t('dashboard.activity_desc')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('dashboard.quick_actions')}</CardTitle>
                            <CardDescription>{t('dashboard.one_tap')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Link to="/communication">
                                <Button variant="ghost" className="w-full justify-start h-12">
                                    <MessageSquare className="mr-3 h-4 w-4 text-purple-500" />
                                    {t('dashboard.messages')}
                                </Button>
                            </Link>
                            <Link to="/agent/my-properties">
                                <Button variant="ghost" className="w-full justify-start h-12">
                                    <Building2 className="mr-3 h-4 w-4 text-blue-500" />
                                    {t('property.my_properties')}
                                </Button>
                            </Link>
                            <Link to="/payments/subscription">
                                <Button variant="ghost" className="w-full justify-start h-12">
                                    <Settings className="mr-3 h-4 w-4 text-orange-500" />
                                    {t('dashboard.subscription')}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
