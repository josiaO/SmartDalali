import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProperties, type Property, type PropertyFilters } from '@/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyRow } from '@/components/properties/PropertyRow';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, Map as MapIcon, List, LayoutGrid } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PROPERTY_TYPES } from '@/lib/constants';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

export default function BrowseProperties() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-created_at');

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

  function applyFilters() {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (city) params.set('city', city);
    if (propertyType && propertyType !== 'all') params.set('type', propertyType);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (sort) params.set('sort', sort);
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchQuery('');
    setCity('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setBedrooms('');
    setSort('-created_at');
    setSearchParams(new URLSearchParams());
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    applyFilters();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{t('properties.properties')}</h1>
        <p className="text-muted-foreground mb-6">
          {t('dashboard.manage_desc')}
        </p>

        {/* Search Bar & Filter Toggle */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              type="search"
              placeholder={t('properties.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              {t('common.search')}
            </Button>
          </form>

          <div className="flex gap-2">
            <div className="flex bg-muted rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                {t('properties.view_mode_grid')}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4 mr-2" />
                {t('properties.view_mode_list')}
              </Button>
              <Button
                variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="px-3"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                {t('properties.view_mode_map')}
              </Button>
            </div>

            <Sheet>
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
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>{t('properties.city')}</Label>
                    <Input
                      placeholder={t('properties.city_placeholder')}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('properties.type')}</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.select_type')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('properties.min_price')}</Label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('properties.max_price')}</Label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('properties.bedrooms')}</Label>
                    <Input
                      type="number"
                      placeholder={t('properties.bedrooms')}
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('common.sort_by')}</Label>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-created_at">{t('common.newest')}</SelectItem>
                        <SelectItem value="price">{t('common.price_low_high')}</SelectItem>
                        <SelectItem value="-price">{t('common.price_high_low')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={() => {
                      applyFilters();
                    }}>
                      {t('common.apply')}
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      {t('common.clear')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters Display */}
        {(city || propertyType || minPrice || maxPrice || bedrooms) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {city && (
              <Button variant="secondary" size="sm" onClick={() => { setCity(''); applyFilters(); }}>
                {t('properties.city')}: {city} <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            {propertyType && propertyType !== 'all' && (
              <Button variant="secondary" size="sm" onClick={() => { setPropertyType(''); applyFilters(); }}>
                {t('properties.type')}: {PROPERTY_TYPES.find(t => t.value === propertyType)?.label || propertyType} <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            {minPrice && (
              <Button variant="secondary" size="sm" onClick={() => { setMinPrice(''); applyFilters(); }}>
                Min: {minPrice} <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            {maxPrice && (
              <Button variant="secondary" size="sm" onClick={() => { setMaxPrice(''); applyFilters(); }}>
                Max: {maxPrice} <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            {bedrooms && (
              <Button variant="secondary" size="sm" onClick={() => { setBedrooms(''); applyFilters(); }}>
                {t('properties.bedrooms')}: {bedrooms} <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              {t('common.clear_all')}
            </Button>
          </div>
        )}

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
          </div>
        ) : viewMode === 'map' ? (
          <PropertyMap properties={properties} />
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {properties.map((property) => (
              <PropertyRow key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

