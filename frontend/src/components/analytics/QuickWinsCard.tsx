import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar, Lightbulb, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface QuickWin {
    action: string;
    title: string;
    count?: number;
    property_id?: string;
    link: string;
}

interface Props {
    quickWins: QuickWin[];
    isLoading?: boolean;
}

export default function QuickWinsCard({ quickWins, isLoading }: Props) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Quick Wins
                    </CardTitle>
                    <CardDescription>Actionable items to boost performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!quickWins || quickWins.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Quick Wins
                    </CardTitle>
                    <CardDescription>Actionable items to boost performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs mt-1">No quick wins available at the moment.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'add_images':
                return '📸';
            case 'respond_messages':
                return '💬';
            case 'update_price':
                return '💰';
            default:
                return '⚡';
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Quick Wins
                </CardTitle>
                <CardDescription>Take action now for immediate results</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {quickWins.map((win, index) => (
                        <Link key={index} to={win.link}>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-border/50 hover:border-primary/50 cursor-pointer group">
                                <div className="text-2xl">{getActionIcon(win.action)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {win.title}
                                    </p>
                                    {win.count && (
                                        <Badge variant="secondary" className="mt-1 text-xs">
                                            {win.count} {win.count === 1 ? 'item' : 'items'}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                                    →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
