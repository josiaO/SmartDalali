import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ExternalLink, Share2, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatTZS } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface PropertySummary {
    id: number;
    title: string;
    price: number | string;
    city: string;
    address?: string;
    primary_image?: string;
    images?: string[];
    status: string;
    type?: string;
}

interface PropertyChatCardProps {
    property: PropertySummary;
    compact?: boolean;
    className?: string;
}

export function PropertyChatCard({ property, compact = false, className }: PropertyChatCardProps) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleViewProperty = () => {
        window.open(`/properties/${property.id}`, '_blank');
    };

    const handleShareProperty = () => {
        const url = `${window.location.origin}/properties/${property.id}`;
        if (navigator.share) {
            navigator.share({
                title: property.title,
                url: url,
            });
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    if (compact) {
        // Compact mode for conversation list
        return (
            <div
                className={cn(
                    "flex items-center gap-3 p-2 rounded-lg border bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer",
                    className
                )}
                onClick={handleViewProperty}
            >
                <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-muted">
                    {property.primary_image || property.images?.[0] ? (
                        <img
                            src={property.primary_image || property.images?.[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Home className="h-5 w-5 text-muted-foreground" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{property.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{property.city}</span>
                        <span className="flex-shrink-0 font-semibold text-primary">
                            {formatTZS(property.price)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Full mode for chat header
    return (
        <Card className={cn("border-l-4 border-l-primary", className)}>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted">
                        {property.primary_image || property.images?.[0] ? (
                            <img
                                src={property.primary_image || property.images?.[0]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Home className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base truncate">{property.title}</h4>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="truncate">{property.city}{property.address && `, ${property.address}`}</span>
                                </div>
                            </div>
                            <Badge variant="secondary" className="flex-shrink-0 text-xs">
                                {property.status?.replace('_', ' ')}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">
                                {formatTZS(property.price)}
                            </span>
                            {property.type && (
                                <Badge variant="outline" className="text-xs">
                                    {property.type}
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleViewProperty}
                                className="flex-1 gap-1.5"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="text-xs">{t('dashboard.view_full_property')}</span>
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleShareProperty}
                                className="gap-1.5"
                            >
                                <Share2 className="h-3.5 w-3.5" />
                                <span className="text-xs sr-only md:not-sr-only">{t('dashboard.share_property')}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
