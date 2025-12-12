import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeadInsights {
    new_messages_7d: number;
    new_messages_30d: number;
    conversations_started: number;
    avg_response_time: string;
    avg_response_time_seconds: number;
    most_inquired_property: {
        id: string;
        title: string;
        count: number;
    } | null;
}

interface Props {
    insights: LeadInsights;
    isLoading?: boolean;
}

export default function LeadMetricsCard({ insights, isLoading }: Props) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Lead Analytics
                    </CardTitle>
                    <CardDescription>Buyer engagement and response metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Handle when data is not yet available
    if (!insights) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-600" />
                        Lead Analytics
                    </CardTitle>
                    <CardDescription>Buyer engagement and response metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No data available</p>
                        <p className="text-xs mt-1">Lead insights will appear as you get activity.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const metrics = [
        {
            label: 'New Messages (7d)',
            value: insights.new_messages_7d,
            icon: MessageSquare,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        },
        {
            label: 'New Messages (30d)',
            value: insights.new_messages_30d,
            icon: MessageSquare,
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
        },
        {
            label: 'Conversations Started',
            value: insights.conversations_started,
            icon: Users,
            color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
        },
        {
            label: 'Avg Response Time',
            value: insights.avg_response_time,
            icon: Clock,
            color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
            isTime: true,
        },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-600" />
                    Lead Analytics
                </CardTitle>
                <CardDescription>Buyer engagement and response metrics</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {metrics.map((metric, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className={`p-2 rounded-lg ${metric.color}`}>
                                <metric.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{metric.label}</p>
                                <p className="text-lg font-bold mt-0.5">
                                    {metric.isTime ? metric.value : metric.value.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Most Inquired Property */}
                {insights.most_inquired_property && (
                    <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-start gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-foreground">Most Inquired Property</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Your top performer
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <p className="text-sm font-medium text-foreground truncate flex-1 mr-2">
                                {insights.most_inquired_property.title}
                            </p>
                            <Badge variant="secondary" className="shrink-0">
                                {insights.most_inquired_property.count} {insights.most_inquired_property.count === 1 ? 'inquiry' : 'inquiries'}
                            </Badge>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
