import { useState } from 'react';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useProperties } from '@/hooks/useProperties';
import { PropertyFilters } from '@/api/properties';
import { PropertyCard } from '@/components/properties/PropertyCard';
import { SearchBox } from '@/components/properties/SearchBox';
import { Filters } from '@/components/properties/Filters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function Browse() {
    const [filters, setFilters] = useState<PropertyFilters>({});
    const { properties, isLoading } = useProperties(filters);

    const handleFilterChange = (newFilters: Partial<PropertyFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    };

    return (
        <PublicLayout>
            <div className="container px-4 md:px-8 max-w-screen-xl mx-auto py-8">
                {/* Hero Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Find Your Dream Property
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Browse thousands of properties for sale and rent across Kenya
                    </p>
                </div>

                {/* Search Box */}
                <div className="mb-6">
                    <SearchBox
                        onSearch={(search) => handleFilterChange({ search })}
                        placeholder="Search by location, property type..."
                    />
                </div>

                {/* Filters */}
                <div className="mb-8">
                    <Filters
                        filters={filters}
                        onChange={handleFilterChange}
                    />
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-muted-foreground">
                        {isLoading ? 'Loading...' : `${properties.length} properties found`}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant={filters.ordering === '-price' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFilterChange({ ordering: '-price' })}
                        >
                            Price: High to Low
                        </Button>
                        <Button
                            variant={filters.ordering === 'price' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFilterChange({ ordering: 'price' })}
                        >
                            Price: Low to High
                        </Button>
                    </div>
                </div>

                {/* Property Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-48 w-full rounded-2xl" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg">No properties found matching your criteria</p>
                        <Button
                            onClick={() => setFilters({})}
                            variant="outline"
                            className="mt-4"
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
