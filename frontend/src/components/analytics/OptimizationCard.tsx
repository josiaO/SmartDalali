import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Image, Video, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface OptimizationSuggestion {
    property_id?: string;
    property_title?: string;
    type: string;
    message: string;
}

interface Props {
    suggestions: OptimizationSuggestion[];
    isLoading?: boolean;
}

export default function OptimizationCard({ suggestions, isLoading }: Props) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        Optimization Suggestions
                    </CardTitle>
                    <CardDescription>AI-powered recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!suggestions || suggestions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        Optimization Suggestions
                    </CardTitle>
                    <CardDescription>AI-powered recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Your listings look great!</p>
                        <p className="text-xs mt-1">No optimization suggestions at the moment.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'images':
                return <Image className="h-4 w-4" />;
            case 'video':
                return <Video className="h-4 w-4" />;
            case 'visibility':
                return <TrendingUp className="h-4 w-4" />;
            case 'price':
                return <DollarSign className="h-4 w-4" />;
            default:
                return <Lightbulb className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'images':
                return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            case 'video':
                return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
            case 'visibility':
                return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
            case 'price':
                return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            default:
                return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
        }
    };

    return (
        <Card className="border-amber-200 dark:border-amber-900/50">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    Optimization Suggestions
                </CardTitle>
                <CardDescription>Improve your listings for better results</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                        >
                            <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
                                {getTypeIcon(suggestion.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground leading-relaxed">
                                    {suggestion.message}
                                </p>
                                {suggestion.property_id && (
                                    <Link
                                        to={`/properties/${suggestion.property_id}/edit`}
                                        className="text-xs text-primary hover:underline mt-1 inline-block"
                                    >
                                        Edit Property →
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
