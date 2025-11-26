import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProperties, type Property, type PropertyFilters } from '@/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { PropertyMap } from '@/components/properties/PropertyMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Filter, X, Map as MapIcon, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PROPERTY_TYPES } from '@/lib/constants';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function BrowseProperties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
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
        title: 'Error',
        description: 'Failed to load properties',
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
        <h1 className="text-4xl font-bold mb-4">Property Listings</h1>
        <p className="text-muted-foreground mb-6">
          Find your dream home from our exclusive listings.
        </p>

        {/* Search Bar & Filter Toggle */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              type="search"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <div className="flex bg-muted rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="px-3"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Map
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Properties</SheetTitle>
                  <SheetDescription>
                    Refine your search results
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="Enter city..."
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Property Type</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Price</Label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Price</Label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Input
                      type="number"
                      placeholder="Number of bedrooms"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sort} onValueChange={setSort}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-created_at">Newest First</SelectItem>
                        <SelectItem value="price">Price: Low to High</SelectItem>
                        <SelectItem value="-price">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1" onClick={() => {
                      applyFilters();
                      // Close sheet logic would go here if controlled
                    }}>
                      Apply Filters
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear
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
                City: {city} <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            {propertyType && propertyType !== 'all' && (
              <Button variant="secondary" size="sm" onClick={() => { setPropertyType(''); applyFilters(); }}>
                Type: {PROPERTY_TYPES.find(t => t.value === propertyType)?.label || propertyType} <X className="ml-2 h-3 w-3" />
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
                Beds: {bedrooms} <X className="ml-2 h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear All
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        ) : viewMode === 'map' ? (
          <PropertyMap properties={properties} />
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
