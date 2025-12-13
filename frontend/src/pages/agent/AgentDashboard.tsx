import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    BarChart3, Users, DollarSign, Eye, ArrowUpRight, Loader2,
    Building2, MessageSquare, TrendingUp, Plus, Settings, Heart,
    Sparkles, Home, Calendar, Check, X, Trash2, ArrowRight, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    getAgentStatsExtended,
    getPropertyPerformance,
    getLeadInsights,
    getGeographicInsights,
    getEngagementHeatmap,
    getOptimizationSuggestions,
    getQuickWins,
    LeadInsights, // Import LeadInsights
    EngagementHeatmap as EngagementHeatmapType, // Import EngagementHeatmap with alias
} from '@/api/analytics';
import { trackDashboardView, trackKPICardClick } from '@/lib/analytics';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { getDashboardInsights } from '@/api/insights';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// Import analytics components
import PropertyPerformanceTable from '@/components/analytics/PropertyPerformanceTable';
import LeadMetricsCard from '@/components/analytics/LeadMetricsCard';
import GeographicList from '@/components/analytics/GeographicList';
import EngagementHeatmap from '@/components/analytics/EngagementHeatmap';
import OptimizationCard from '@/components/analytics/OptimizationCard';
import QuickWinsCard from '@/components/analytics/QuickWinsCard';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring" as const,
            stiffness: 100,
            damping: 12
        }
    }
};

const cardHoverVariants = {
    rest: { scale: 1 },
    hover: {
        scale: 1.02,
        transition: {
            duration: 0.3,
            type: "spring" as const,
            stiffness: 300
        }
    }
};

export default function AgentDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();

    // Track dashboard view on mount
    useEffect(() => {
        trackDashboardView('agent');
    }, []);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['agent-stats'],
        queryFn: getAgentStatsExtended,
    });

    const { data: insights, isLoading: insightsLoading } = useQuery({
        queryKey: ['dashboard-insights'],
        queryFn: getDashboardInsights,
    });

    // Analytics queries
    const { data: propertyPerformance, isLoading: performanceLoading } = useQuery({
        queryKey: ['property-performance'],
        queryFn: () => getPropertyPerformance(),
    });

    const { data: leadInsights, isLoading: leadLoading } = useQuery({
        queryKey: ['lead-insights'],
        queryFn: () => getLeadInsights(),
    });

    const { data: geoInsights, isLoading: geoLoading } = useQuery({
        queryKey: ['geo-insights'],
        queryFn: () => getGeographicInsights(),
    });

    const { data: heatmap, isLoading: heatmapLoading } = useQuery({
        queryKey: ['engagement-heatmap'],
        queryFn: getEngagementHeatmap,
    });

    const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
        queryKey: ['optimization-suggestions'],
        queryFn: getOptimizationSuggestions,
    });

    const { data: quickWins, isLoading: quickWinsLoading } = useQuery({
        queryKey: ['quick-wins'],
        queryFn: getQuickWins,
    });

    const queryClient = useQueryClient();

    const isLoading = statsLoading || insightsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="h-8 w-8 text-primary" />
                </motion.div>
            </div>
        );
    }

    const kpiItems = [
        {
            key: "listings",
            label: t('dashboard.total_listings'),
            value: stats?.total_listings || 0,
            secondaryValue: `${stats?.active_listings || 0} active`,
            icon: Home,
            gradient: "from-blue-500 via-blue-600 to-cyan-600",
            iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
            glowColor: "group-hover:shadow-blue-500/25"
        },
        {
            key: "views",
            label: t('dashboard.total_views'),
            value: insights?.kpis.total_views || stats?.total_views || 0,
            secondaryValue: `+${stats?.views_7d || 0} this week`,
            icon: Eye,
            gradient: "from-purple-500 via-purple-600 to-pink-600",
            iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
            glowColor: "group-hover:shadow-purple-500/25"
        },
        {
            key: "inquiries",
            label: t('dashboard.inquiries'),
            value: insights?.kpis.total_leads || stats?.total_inquiries || 0,
            secondaryValue: `+${stats?.inquiries_7d || 0} this week`,
            icon: Users,
            gradient: "from-green-500 via-green-600 to-emerald-600",
            iconBg: "bg-gradient-to-br from-green-500 to-emerald-500",
            glowColor: "group-hover:shadow-green-500/25"
        },
        {
            key: "earnings",
            label: t('dashboard.earnings'),
            value: stats?.earnings || 0,
            displayValue: `TZS ${(stats?.earnings || 0).toLocaleString()}`,
            icon: DollarSign,
            gradient: "from-orange-500 via-orange-600 to-amber-600",
            iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
            glowColor: "group-hover:shadow-orange-500/25"
        },
    ];

    return (
        <motion.div
            className="space-y-8 pb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Premium Header with Glassmorphism */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 p-8 border border-primary/10 backdrop-blur-sm"
            >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5 }}
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg"
                            >
                                <Sparkles className="w-6 h-6 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                    {t('dashboard.overview')}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {t('dashboard.welcome_back')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
                            <Avatar className="ring-2 ring-primary/20">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-sm font-medium">{user?.first_name} {user?.last_name}</div>
                                <div className="text-xs text-muted-foreground">{user?.email}</div>
                            </div>
                        </div>
                        <Link to="/properties/create">
                            <Button className="gap-2 shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                                <Plus className="h-4 w-4" />
                                {t('dashboard.add_property')}
                                <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Premium KPI Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiItems.map((item, index) => (
                    <motion.div
                        key={item.key}
                        variants={cardHoverVariants}
                        initial="rest"
                        whileHover="hover"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => trackKPICardClick(item.label, item.value)}
                        className="cursor-pointer"
                    >
                        <Card className={`relative overflow-hidden group border-2 border-transparent hover:border-primary/20 transition-all duration-300 ${item.glowColor} shadow-lg hover:shadow-2xl`}>
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`} />

                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transition: 'transform 0.7s ease-in-out' }} />

                            <CardContent className="relative p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                        transition={{ duration: 0.3 }}
                                        className={`${item.iconBg} p-3 rounded-xl shadow-lg`}
                                    >
                                        <item.icon className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <motion.div
                                        initial={{ x: 0, y: 0 }}
                                        whileHover={{ x: 3, y: -3 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </motion.div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <h3 className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                                        {item.key === 'earnings' ? (
                                            item.displayValue
                                        ) : (
                                            <AnimatedNumber value={item.value} duration={1500} />
                                        )}
                                    </h3>
                                    {item.secondaryValue && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3 text-green-500" />
                                            {item.secondaryValue}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick Access Section */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Messages Card */}
                <Link to="/communication">
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                        className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-lg"
                                    >
                                        <MessageSquare className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{t('dashboard.messages')}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('dashboard.client_messages')}
                                        </p>
                                        {stats?.new_messages && stats.new_messages > 0 && (
                                            <Badge variant="default" className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500">
                                                {stats.new_messages} {t('dashboard.new_messages')}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <motion.div
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                </motion.div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* My Properties Card */}
                <Link to="/agent/my-properties">
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 cursor-pointer bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                        className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl shadow-lg"
                                    >
                                        <Building2 className="w-6 h-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{t('sidebar.my_properties')}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {t('dashboard.manage_listings')}
                                        </p>
                                    </div>
                                </div>
                                <motion.div
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                                </motion.div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </motion.div>

            {/* Analytics Section with Beautiful Divider */}
            <motion.div variants={itemVariants} className="relative">
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">{t('dashboard.analytics_title') || 'Performance Analytics'}</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
            </motion.div>

            {/* Property Performance & Lead Insights */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <PropertyPerformanceTable
                        properties={propertyPerformance || []}
                        isLoading={performanceLoading}
                    />
                </div>
                <div>
                    <LeadMetricsCard
                        insights={leadInsights as LeadInsights}
                        isLoading={leadLoading}
                    />
                </div>
            </motion.div>

            {/* Geographic Insights & Engagement Heatmap */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GeographicList
                    topSearchLocations={geoInsights?.top_search_locations || []}
                    topViewLocations={geoInsights?.top_view_locations || []}
                    isLoading={geoLoading}
                />
                <EngagementHeatmap
                    heatmapData={heatmap as EngagementHeatmapType}
                    isLoading={heatmapLoading}
                />
            </motion.div>

            {/* Optimization & Quick Wins */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OptimizationCard
                    suggestions={suggestions || []}
                    isLoading={suggestionsLoading}
                />
                <QuickWinsCard
                    quickWins={quickWins || []}
                    isLoading={quickWinsLoading}
                />
            </motion.div>
        </motion.div>
    );
}
