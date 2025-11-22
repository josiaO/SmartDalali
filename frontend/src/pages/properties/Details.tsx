import { useParams } from 'react-router-dom';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useProperties } from '@/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Bed, Bath, Maximize, Mail, Phone, MessageSquare } from 'lucide-react';
import { formatPrice } from '@/lib/helpers';
import { useUI } from '@/contexts/UIContext';

export function Details() {
    const { id } = useParams<{ id: string }>();
    const { useProperty } = useProperties();
    const { data: property, isLoading } = useProperty(id!);
    const { showMessagingDisabled } = useUI();

    if (isLoading) {
        return (
            <PublicLayout>
                <div className="container px-4 md:px-8 max-w-screen-xl mx-auto py-8">
                    <Skeleton className="h-96 w-full rounded-2xl mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (!property) {
        return (
            <PublicLayout>
                <div className="container px-4 md:px-8 max-w-screen-xl mx-auto py-16 text-center">
                    <h2 className="text-2xl font-bold mb-4">Property not found</h2>
                    <Button onClick={() => window.history.back()}>Go Back</Button>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            <div className="container px-4 md:px-8 max-w-screen-xl mx-auto py-8">
                {/* Image Gallery */}
                <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                    {property.images.length > 0 ? (
                        <img
                            src={property.images.find((img) => img.is_primary)?.image || property.images[0]?.image}
                            alt={property.title}
                            className="w-full h-96 object-cover"
                        />
                    ) : (
                        <div className="w-full h-96 bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground">No image available</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Badge>{property.property_type}</Badge>
                                {!property.is_available && <Badge variant="secondary">Unavailable</Badge>}
                            </div>
                            <h1 className="text-4xl font-bold mb-2">{property.title}</h1>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-5 w-5" />
                                <span>{property.address}, {property.city}</span>
                            </div>
                        </div>

                        {/* Price & Features */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-3xl font-bold text-primary mb-4">
                                    {formatPrice(property.price)}
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Bed className="h-5 w-5 text-muted-foreground" />
                                        <span>{property.bedrooms} Bedrooms</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Bath className="h-5 w-5 text-muted-foreground" />
                                        <span>{property.bathrooms} Bathrooms</span>
                                    </div>
                                    {property.square_feet && (
                                        <div className="flex items-center gap-2">
                                            <Maximize className="h-5 w-5 text-muted-foreground" />
                                            <span>{property.square_feet} sqft</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-bold mb-4">Description</h2>
                                <p className="text-muted-foreground whitespace-pre-line">
                                    {property.description}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Map */}
                        {property.latitude && property.longitude && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h2 className="text-2xl font-bold mb-4">Location</h2>
                                    <div className="w-full h-64 rounded-xl overflow-hidden">
                                        <iframe
                                            src={`https://www.google.com/maps?q=${property.latitude},${property.longitude}&output=embed`}
                                            width="100%"
                                            height="100%"
                                            style={{ border: 0 }}
                                            loading="lazy"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Agent Contact */}
                    <div className="lg:sticky lg:top-20 h-fit">
                        <Card className="shadow-lg">
                            <CardContent className="pt-6 space-y-4">
                                <h3 className="text-xl font-bold">Contact Agent</h3>

                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold">
                                            {property.agent.first_name} {property.agent.last_name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">{property.agent.email}</p>
                                        {property.agent.phone_number && (
                                            <p className="text-sm text-muted-foreground">{property.agent.phone_number}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Button className="w-full" variant="outline" asChild>
                                            <a href={`mailto:${property.agent.email}`}>
                                                <Mail className="h-4 w-4 mr-2" />
                                                Email Agent
                                            </a>
                                        </Button>

                                        {property.agent.phone_number && (
                                            <Button className="w-full" variant="outline" asChild>
                                                <a href={`tel:${property.agent.phone_number}`}>
                                                    <Phone className="h-4 w-4 mr-2" />
                                                    Call Agent
                                                </a>
                                            </Button>
                                        )}

                                        {/* Disabled Message Button */}
                                        <Button
                                            className="w-full"
                                            onClick={showMessagingDisabled}
                                            disabled
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Message Agent
                                        </Button>
                                        <p className="text-xs text-center text-muted-foreground">
                                            Messaging coming soon
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
