import { useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchProperties, type Property, type PropertyFilters } from '@/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { Button } from '@/components/ui/button';
import { Filter, Map as MapIcon, List, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { FilterSidebar } from '@/components/properties/FilterSidebar';
import { useState, useEffect } from 'react';

export default function BrowseProperties() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const { toast } = useToast();

  // Filter states
  // Filter states (sync with URL via Sidebar, but we need search query state for global)
  // Sidebar handles most filters directly via URL
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [searchParams]);

  async function loadProperties() {
    setLoading(true);
    try {
      const filters: PropertyFilters = {
        search: searchParams.get('search') || undefined,
        city: searchParams.get('city') || undefined,
        property_type: searchParams.get('type') || undefined,
        min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
        max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
        bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
        bathrooms: searchParams.get('bathrooms') ? Number(searchParams.get('bathrooms')) : undefined,
        amenities: searchParams.get('amenities') || undefined,
        listing_type: searchParams.get('listing_type') || undefined,
        ordering: searchParams.get('sort') || '-created_at',
      };

      const data = await fetchProperties(filters);
      setProperties(data.results);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('notifications.error_occurred'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function cleanupFilters() {
    // Clear all filters
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('properties.properties')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('dashboard.manage_desc')}
        </p>

        {searchParams.get('from') === 'dashboard' && (
          <div className="mb-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
                ← {t('dashboard.my_dashboard')}
              </Button>
            </Link>
          </div>
        )}

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-24">
              <h3 className="font-semibold text-lg mb-4">{t('common.filters')}</h3>
              <FilterSidebar
                onApply={() => { }}
                onClear={cleanupFilters}
              />
            </div>
          </aside>

          {/* Property Grid & Mobile Header */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">
                {loading ? 'Searching...' : `${properties.length} Results found`}
              </p>

              <div className="flex gap-2">
                {/* View Modes */}
                <div className="flex bg-muted rounded-md p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="px-3"
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Mobile Filter Trigger */}
                <div className="lg:hidden">
                  <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        {t('common.filters')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>{t('common.filters')}</SheetTitle>
                        <SheetDescription>
                          {t('properties.filter_desc')}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterSidebar
                          onApply={() => setIsFilterOpen(false)}
                          onClear={cleanupFilters}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">{t('properties.no_properties')}</h3>
                <p className="text-muted-foreground">
                  {t('properties.no_results')}
                </p>
                <Button variant="link" onClick={cleanupFilters}>
                  {t('common.clear_all')}
                </Button>
              </div>
            ) : viewMode === 'map' ? (
              <PropertyMap properties={properties} />
            ) : (
              <div className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    viewMode={viewMode === 'list' ? 'list' : 'grid'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

