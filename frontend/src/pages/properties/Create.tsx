import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentLayout } from '@/layouts/AgentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function Create() {
    const navigate = useNavigate();
    const { createProperty, isCreating } = useProperties();
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

    const [images, setImages] = useState<File[]>([]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createProperty({
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
                images,
            });

            showSuccess('Property created successfully!');
            navigate('/dashboard/agent');
        } catch (error: any) {
            showError(error.message || 'Failed to create property');
        }
    };

    return (
        <AgentLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Add New Property</h1>
                        <p className="text-muted-foreground">Fill in the details to list your property</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Details</CardTitle>
                            <CardDescription>Provide accurate information about your property</CardDescription>
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
                                        placeholder="e.g., Modern 3BR Apartment in Westlands"
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
                                        placeholder="5000000"
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
                                        placeholder="3"
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
                                        placeholder="2"
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
                                        placeholder="1500"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        placeholder="Describe your property, its features, and surroundings..."
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
                                            placeholder="123 Main Street"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => handleChange('city', e.target.value)}
                                            placeholder="Nairobi"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="state">State/County (Optional)</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => handleChange('state', e.target.value)}
                                            placeholder="Nairobi County"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="zip_code">Postal Code (Optional)</Label>
                                        <Input
                                            id="zip_code"
                                            value={formData.zip_code}
                                            onChange={(e) => handleChange('zip_code', e.target.value)}
                                            placeholder="00100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Images */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Images</h3>
                                <div>
                                    <Label htmlFor="images">Upload Property Images</Label>
                                    <Input
                                        id="images"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {images.length > 0
                                            ? `${images.length} image(s) selected`
                                            : 'Select up to 10 images'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <Button type="submit" disabled={isCreating} className="flex-1">
                                    {isCreating ? 'Creating...' : 'Create Property'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate(-1)}
                                    disabled={isCreating}
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
