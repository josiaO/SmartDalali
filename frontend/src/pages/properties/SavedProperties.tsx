import { useQuery } from '@tanstack/react-query';
import { getLikedProperties } from '@/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { Loader2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function SavedProperties() {
    const { t } = useTranslation();
    const { data: properties, isLoading } = useQuery({
        queryKey: ['liked-properties'],
        queryFn: getLikedProperties,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('dashboard.saved_properties')}</h1>
                <p className="text-muted-foreground">
                    {t('dashboard.saved_desc')}
                </p>
            </div>

            {properties && properties.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                    <div className="rounded-full bg-muted p-4">
                        <Heart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{t('dashboard.no_listings')}</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">
                        {t('dashboard.saved_desc')}
                    </p>
                    <Link to="/properties">
                        <Button>{t('sidebar.browse_properties')}</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
