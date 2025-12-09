import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getViewedProperties, fetchProperty, type Property } from '@/api/properties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { PropertyCard } from './PropertyCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

export function RecentlyViewed() {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadViewed() {
            try {
                if (user) {
                    // Authenticated: Fetch from API
                    const data = await getViewedProperties();
                    // API returns objects directly? Or paginated?
                    // backend views_properties returns serializer.data (list).
                    setProperties(Array.isArray(data) ? data : (data as any).results || []);
                } else {
                    // Guest: Fetch from localStorage
                    const viewedIds = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
                    if (viewedIds.length > 0) {
                        // Fetch details for each (parallel)
                        // Limit to 5 for performance if not paginated
                        const promises = viewedIds.slice(0, 6).map((id: string) => fetchProperty(id).catch(() => null));
                        const results = await Promise.all(promises);
                        setProperties(results.filter(Boolean) as Property[]);
                    }
                }
            } catch (error) {
                console.error('Failed to load recently viewed:', error);
            } finally {
                setLoading(false);
            }
        }

        loadViewed();
    }, [user]);

    const { t } = useTranslation();

    if (loading) return <LoadingSpinner />;
    if (properties.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">{t('dashboard.recent_viewers')}</h2>
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                    {properties.map((property) => (
                        <div key={property.id} className="w-[300px]">
                            <PropertyCard property={property} />
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
