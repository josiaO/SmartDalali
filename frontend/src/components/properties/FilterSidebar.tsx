import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import { PROPERTY_TYPES } from '@/lib/constants';

interface FilterSidebarProps {
    onApply: (query?: string) => void;
    onClear: () => void;
    className?: string;
}

export function FilterSidebar({ onApply, onClear, className }: FilterSidebarProps) {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Local state for debounced inputs
    const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');

    // Sync local state when URL changes
    useEffect(() => {
        setMinPrice(searchParams.get('min_price') || '');
        setMaxPrice(searchParams.get('max_price') || '');
    }, [searchParams]);

    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams);

        // Reset page when filtering
        params.delete('page');

        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        setSearchParams(params);
        // instant apply for selects
    };

    const handlePriceChange = (type: 'min' | 'max', value: string) => {
        if (type === 'min') setMinPrice(value);
        else setMaxPrice(value);
    };

    const applyPrice = () => {
        const params = new URLSearchParams(searchParams);
        if (minPrice) params.set('min_price', minPrice);
        else params.delete('min_price');

        if (maxPrice) params.set('max_price', maxPrice);
        else params.delete('max_price');

        setSearchParams(params);
    };

    const amenities = [
        { id: 'wifi', label: 'WiFi' },
        { id: 'parking', label: 'Parking' },
        { id: 'balcony', label: 'Balcony' },
        { id: 'air_conditioning', label: 'Air Conditioning' },
        { id: 'furnished', label: 'Furnished' },
    ];

    const toggleAmenity = (amenityId: string) => {
        const current = searchParams.get('amenities')?.split(',') || [];
        let newAmenities;
        if (current.includes(amenityId)) {
            newAmenities = current.filter(a => a !== amenityId);
        } else {
            newAmenities = [...current, amenityId];
        }

        updateFilter('amenities', newAmenities.length > 0 ? newAmenities.join(',') : null);
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Search Location */}
            <div className="space-y-2">
                <Label>{t('properties.city')}</Label>
                <Input
                    placeholder="E.g. Arusha"
                    value={searchParams.get('city') || ''}
                    onChange={(e) => updateFilter('city', e.target.value)}
                />
            </div>

            {/* Listing Type */}
            <div className="space-y-2">
                <Label>Listing Type</Label>
                <Select
                    value={searchParams.get('listing_type') || 'all'}
                    onValueChange={(val) => updateFilter('listing_type', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="for_rent">For Rent</SelectItem>
                        <SelectItem value="for_sale">For Sale</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
                <Label>{t('properties.type')}</Label>
                <Select
                    value={searchParams.get('type') || 'all'}
                    onValueChange={(val) => updateFilter('type', val)}
                >
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

            {/* Price Range */}
            <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Input
                        placeholder="Min"
                        type="number"
                        value={minPrice}
                        onChange={(e) => handlePriceChange('min', e.target.value)}
                        onBlur={applyPrice}
                    />
                    <Input
                        placeholder="Max"
                        type="number"
                        value={maxPrice}
                        onChange={(e) => handlePriceChange('max', e.target.value)}
                        onBlur={applyPrice}
                    />
                </div>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
                <Label>{t('properties.bedrooms')}</Label>
                <Select
                    value={searchParams.get('bedrooms') || 'all'}
                    onValueChange={(val) => updateFilter('bedrooms', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
                <Label>Bathrooms</Label>
                <Select
                    value={searchParams.get('bathrooms') || 'all'}
                    onValueChange={(val) => updateFilter('bathrooms', val)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="space-y-2">
                    {amenities.map(amenity => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={amenity.id}
                                checked={(searchParams.get('amenities')?.split(',') || []).includes(amenity.id)}
                                onCheckedChange={() => toggleAmenity(amenity.id)}
                            />
                            <label
                                htmlFor={amenity.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {amenity.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <Button variant="outline" className="w-full" onClick={onClear}>
                {t('common.clear_all')}
            </Button>
        </div>
    );
}
