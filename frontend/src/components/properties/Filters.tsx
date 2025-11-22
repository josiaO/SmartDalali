import { useState } from 'react';
import { PropertyFilters } from '@/api/properties';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { formatPrice } from '@/lib/helpers';

interface FiltersProps {
    filters: PropertyFilters;
    onChange: (filters: Partial<PropertyFilters>) => void;
}

const PROPERTY_TYPES = [
    { value: 'all', label: 'All Types' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' },
];

const BEDROOMS = [
    { value: 'all', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
    { value: '5', label: '5+' },
];

export function Filters({ filters, onChange }: FiltersProps) {
    const [priceRange, setPriceRange] = useState([
        filters.min_price || 0,
        filters.max_price || 50000000,
    ]);
    const [showFilters, setShowFilters] = useState(false);

    const handlePriceChange = (values: number[]) => {
        setPriceRange(values);
    };

    const applyPriceFilter = () => {
        onChange({
            min_price: priceRange[0],
            max_price: priceRange[1],
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
            </div>

            {showFilters && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Property Type */}
                            <div className="space-y-2">
                                <Label>Property Type</Label>
                                <Select
                                    value={filters.property_type || 'all'}
                                    onValueChange={(value) =>
                                        onChange({ property_type: value === 'all' ? undefined : value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bedrooms */}
                            <div className="space-y-2">
                                <Label>Bedrooms</Label>
                                <Select
                                    value={filters.bedrooms?.toString() || 'all'}
                                    onValueChange={(value) =>
                                        onChange({ bedrooms: value === 'all' ? undefined : parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BEDROOMS.map((bed) => (
                                            <SelectItem key={bed.value} value={bed.value}>
                                                {bed.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Price Range */}
                            <div className="md:col-span-2 space-y-2">
                                <Label>
                                    Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                                </Label>
                                <Slider
                                    min={0}
                                    max={50000000}
                                    step={100000}
                                    value={priceRange}
                                    onValueChange={handlePriceChange}
                                    onValueCommit={applyPriceFilter}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setPriceRange([0, 50000000]);
                                    onChange({
                                        property_type: undefined,
                                        bedrooms: undefined,
                                        bathrooms: undefined,
                                        min_price: undefined,
                                        max_price: undefined,
                                    });
                                }}
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
