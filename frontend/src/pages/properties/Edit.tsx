import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AgentLayout } from '@/layouts/AgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useProperties } from '@/hooks/useProperties';
import { useUI } from '@/contexts/UIContext';
import { ArrowLeft } from 'lucide-react';

const PROPERTY_TYPES = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' },
];

export function Edit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { useProperty, updateProperty, isUpdating } = useProperties();
    const { data: property, isLoading } = useProperty(id!);
    const { showSuccess, showError } = useUI();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        property_type: 'apartment',
        bedrooms: '',
        bathrooms: '',
        square_feet: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
    });

    useEffect(() => {
        if (property) {
            setFormData({
                title: property.title,
                description: property.description,
                price: property.price.toString(),
                property_type: property.property_type,
                bedrooms: property.bedrooms.toString(),
                bathrooms: property.bathrooms.toString(),
                square_feet: property.square_feet?.toString() || '',
                address: property.address,
                city: property.city,
                state: property.state || '',
                zip_code: property.zip_code || '',
            });
        }
    }, [property]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateProperty({
                id: id!,
                data: {
                    title: formData.title,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    property_type: formData.property_type,
                    bedrooms: parseInt(formData.bedrooms),
                    bathrooms: parseInt(formData.bathrooms),
                    square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state || undefined,
                    zip_code: formData.zip_code || undefined,
                },
            });

            showSuccess('Property updated successfully!');
            navigate(`/properties/${id}`);
        } catch (error: any) {
            showError(error.message || 'Failed to update property');
        }
    };

    if (isLoading) {
        return (
            <AgentLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </AgentLayout>
        );
    }

    if (!property) {
        return (
            <AgentLayout>
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold mb-4">Property not found</h2>
                    <Button onClick={() => navigate('/dashboard/agent')}>Back to Dashboard</Button>
                </div>
            </AgentLayout>
        );
    }

    return (
        <AgentLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Property</h1>
                        <p className="text-muted-foreground">Update your property details</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Details</CardTitle>
                            <CardDescription>Modify the information about your property</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Label htmlFor="title">Property Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="price">Price (KES) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => handleChange('price', e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="property_type">Property Type *</Label>
                                    <Select
                                        value={formData.property_type}
                                        onValueChange={(value) => handleChange('property_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
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

                                <div>
                                    <Label htmlFor="bedrooms">Bedrooms *</Label>
                                    <Input
                                        id="bedrooms"
                                        type="number"
                                        value={formData.bedrooms}
                                        onChange={(e) => handleChange('bedrooms', e.target.value)}
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="bathrooms">Bathrooms *</Label>
                                    <Input
                                        id="bathrooms"
                                        type="number"
                                        value={formData.bathrooms}
                                        onChange={(e) => handleChange('bathrooms', e.target.value)}
                                        min="0"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="square_feet">Square Feet (Optional)</Label>
                                    <Input
                                        id="square_feet"
                                        type="number"
                                        value={formData.square_feet}
                                        onChange={(e) => handleChange('square_feet', e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={5}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Location</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label htmlFor="address">Street Address *</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => handleChange('address', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="state">State/County (Optional)</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => handleChange('state', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="zip_code">Postal Code (Optional)</Label>
                                        <Input
                                            id="zip_code"
                                            value={formData.zip_code}
                                            onChange={(e) => handleChange('zip_code', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <Button type="submit" disabled={isUpdating} className="flex-1">
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AgentLayout>
    );
}
