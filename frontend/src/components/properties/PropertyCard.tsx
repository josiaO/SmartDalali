import { Link } from 'react-router-dom';
import { Property } from '@/api/properties';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Maximize } from 'lucide-react';
import { formatPrice } from '@/lib/helpers';
import { ROUTES } from '@/lib/constants';

interface PropertyCardProps {
    property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
    const primaryImage = property.images.find((img) => img.is_primary)?.image || property.images[0]?.image;

    return (
        <Link to={ROUTES.PROPERTY_DETAIL(property.id.toString())}>
            <Card className="overflow-hidden hover-lift rounded-2xl border-0 shadow-md group">
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                    {primaryImage ? (
                        <img
                            src={primaryImage}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <span className="text-muted-foreground">No image</span>
                        </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-primary/90 hover:bg-primary">
                        {property.property_type}
                    </Badge>
                </div>

                <CardContent className="p-4 space-y-3">
                    {/* Price */}
                    <div className="flex items-baseline justify-between">
                        <h3 className="text-2xl font-bold text-primary">
                            {formatPrice(property.price)}
                        </h3>
                        {!property.is_available && (
                            <Badge variant="secondary">Unavailable</Badge>
                        )}
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold text-lg line-clamp-1">
                        {property.title}
                    </h4>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{property.city}, {property.address}</span>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms} bath{property.bathrooms > 1 ? 's' : ''}</span>
                        </div>
                        {property.square_feet && (
                            <div className="flex items-center gap-1">
                                <Maximize className="h-4 w-4" />
                                <span>{property.square_feet} sqft</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
