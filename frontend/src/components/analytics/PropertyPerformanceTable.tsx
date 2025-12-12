import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface PropertyPerformance {
    property_id: string;
    title: string;
    views_over_time: Array<{ date: string; views: number }>;
    total_views: number;
    likes: number;
    shares: number;
    contact_attempts: number;
    top_traffic_days: string[];
    device_breakdown: {
        mobile: number;
        desktop: number;
        tablet: number;
    };
}

interface Props {
    properties: PropertyPerformance[];
    isLoading?: boolean;
}

export default function PropertyPerformanceTable({ properties, isLoading }: Props) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Property Performance
                    </CardTitle>
                    <CardDescription>Detailed metrics for your listings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!properties || properties.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Property Performance
                    </CardTitle>
                    <CardDescription>Detailed metrics for your listings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No properties yet</p>
                        <p className="text-xs mt-1">Add properties to see performance metrics.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getTopDevice = (breakdown: { mobile: number; desktop: number; tablet: number }) => {
        const devices = [
            { name: 'Mobile', count: breakdown.mobile, icon: Smartphone },
            { name: 'Desktop', count: breakdown.desktop, icon: Monitor },
            { name: 'Tablet', count: breakdown.tablet, icon: Tablet },
        ];
        const top = devices.sort((a, b) => b.count - a.count)[0];
        return top;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Property Performance
                </CardTitle>
                <CardDescription>Detailed metrics for your listings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {properties.slice(0, 10).map((property) => {
                        const topDevice = getTopDevice(property.device_breakdown);
                        const totalDeviceViews = property.device_breakdown.mobile +
                            property.device_breakdown.desktop +
                            property.device_breakdown.tablet;

                        return (
                            <div
                                key={property.property_id}
                                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                            >
                                {/* Property Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <Link
                                        to={`/properties/${property.property_id}`}
                                        className="flex-1 min-w-0"
                                    >
                                        <h4 className="font-semibold text-sm hover:text-primary transition-colors truncate">
                                            {property.title}
                                        </h4>
                                    </Link>
                                    <Badge variant="secondary" className="shrink-0">
                                        {property.total_views} {property.total_views === 1 ? 'view' : 'views'}
                                    </Badge>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                    <div className="text-center p-2 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Likes</p>
                                        <p className="text-lg font-bold mt-0.5">❤️ {property.likes}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Shares</p>
                                        <p className="text-lg font-bold mt-0.5">🔗 {property.shares}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Contacts</p>
                                        <p className="text-lg font-bold mt-0.5">📞 {property.contact_attempts}</p>
                                    </div>
                                    <div className="text-center p-2 rounded-lg bg-muted/50">
                                        <p className="text-xs text-muted-foreground">Device</p>
                                        <div className="flex items-center justify-center gap-1 mt-0.5">
                                            <topDevice.icon className="h-4 w-4" />
                                            <p className="text-sm font-semibold">{topDevice.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Traffic Days */}
                                {property.top_traffic_days && property.top_traffic_days.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-muted-foreground">Top days:</span>
                                        {property.top_traffic_days.map((day, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                                {day}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
