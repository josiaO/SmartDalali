import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface EngagementDay {
    day: string;
    level: 'Low' | 'Medium' | 'High' | 'Very High';
}

interface Props {
    heatmapData: { days: EngagementDay[] };
    isLoading?: boolean;
}

export default function EngagementHeatmap({ heatmapData, isLoading }: Props) {
    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Very High':
                return 'bg-green-500 text-white';
            case 'High':
                return 'bg-green-400 text-white';
            case 'Medium':
                return 'bg-yellow-400 text-gray-900';
            case 'Low':
                return 'bg-gray-200 dark:bg-gray-700 text-muted-foreground';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-muted-foreground';
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Weekly Engagement Pattern
                    </CardTitle>
                    <CardDescription>Best days to post new listings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!heatmapData || !heatmapData.days || heatmapData.days.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Weekly Engagement Pattern
                    </CardTitle>
                    <CardDescription>Best days to post new listings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Not enough data yet</p>
                        <p className="text-xs mt-1">Engagement patterns will appear as you get more activity.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Engagement Pattern
                </CardTitle>
                <CardDescription>Peak activity days for your listings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {heatmapData.days.map((dayData, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            <div
                                className={`w-full h-20 rounded-lg flex items-center justify-center font-medium text-xs transition-all hover:scale-105 ${getLevelColor(
                                    dayData.level
                                )}`}
                            >
                                <div className="text-center">
                                    <div className="font-semibold">{dayData.day.slice(0, 3)}</div>
                                    <div className="text-[10px] mt-1 opacity-80">{dayData.level}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-6 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                        <span className="text-muted-foreground">Low</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-yellow-400" />
                        <span className="text-muted-foreground">Medium</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-400" />
                        <span className="text-muted-foreground">High</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-muted-foreground">Very High</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
