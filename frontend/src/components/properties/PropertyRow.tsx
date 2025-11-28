import { Property } from '@/api/properties';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Bed, Bath, Square, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PropertyRowProps {
    property: Property;
}

export function PropertyRow({ property }: PropertyRowProps) {
    const { t } = useTranslation();

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-TZ', {
            style: 'currency',
            currency: 'TZS',
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <div className="sm:w-48 h-48 sm:h-auto relative shrink-0">
                        <img
                            src={property.main_image_url || property.media?.[0]?.Images || '/placeholder-property.jpg'}
                            alt={property.title}
                            className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-2 left-2 bg-white/90 text-black hover:bg-white/90">
                            {property.status === 'for_sale' ? t('property.for_sale') : t('property.for_rent')}
                        </Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                                    <div className="flex items-center text-muted-foreground text-sm mt-1">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {property.city}, {property.address}
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-primary whitespace-nowrap">
                                    {formatPrice(property.price)}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                    <Bed className="h-4 w-4 mr-1" />
                                    {property.bedrooms} {t('property.bedrooms')}
                                </div>
                                <div className="flex items-center">
                                    <Bath className="h-4 w-4 mr-1" />
                                    {property.bathrooms} {t('property.bathrooms')}
                                </div>
                                <div className="flex items-center">
                                    <Square className="h-4 w-4 mr-1" />
                                    {property.area} sqft
                                </div>
                                <div className="flex items-center">
                                    <Building2 className="h-4 w-4 mr-1" />
                                    {property.type}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-xs text-muted-foreground">
                                {new Date(property.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Heart className="h-4 w-4" />
                                </Button>
                                <Link to={`/properties/${property.id}`}>
                                    <Button size="sm">{t('property.details')}</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
