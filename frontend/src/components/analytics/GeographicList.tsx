import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Location {
    location: string;
    count: number;
}

interface Props {
    topSearchLocations: Location[];
    topViewLocations: Location[];
    isLoading?: boolean;
}

export default function GeographicList({ topSearchLocations, topViewLocations, isLoading }: Props) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Geographic Insights
                    </CardTitle>
                    <CardDescription>Where buyers are searching from</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const hasData = (topSearchLocations && topSearchLocations.length > 0) ||
        (topViewLocations && topViewLocations.length > 0);

    if (!hasData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Geographic Insights
                    </CardTitle>
                    <CardDescription>Where buyers are searching from</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">No location data yet</p>
                        <p className="text-xs mt-1">Geographic insights will appear as you get more views.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Geographic Insights
                </CardTitle>
                <CardDescription>Popular locations for your listings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Top View Locations */}
                    {topViewLocations && topViewLocations.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                                Most Viewed Property Locations
                            </h4>
                            <div className="space-y-2">
                                {topViewLocations.slice(0, 5).map((location, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                                                {index + 1}
                                            </Badge>
                                            <span className="text-sm font-medium">{location.location}</span>
                                        </div>
                                        <Badge variant="secondary">
                                            {location.count} {location.count === 1 ? 'view' : 'views'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Search Locations */}
                    {topSearchLocations && topSearchLocations.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                                Buyer Search Locations
                            </h4>
                            <div className="space-y-2">
                                {topSearchLocations.slice(0, 5).map((location, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                                                {index + 1}
                                            </Badge>
                                            <span className="text-sm font-medium">{location.location}</span>
                                        </div>
                                        <Badge variant="secondary">
                                            {location.count} {location.count === 1 ? 'search' : 'searches'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
