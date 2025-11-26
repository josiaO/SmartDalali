import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import type { Property } from '@/api/properties';
import { formatTZS } from '@/lib/currency';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.media?.[0]?.Images || '/placeholder.svg';
  const formattedPrice = formatTZS(property.price);

  return (
    <Link to={`/properties/${property.id}`} className="block">
      <Card className="overflow-hidden p-0 transition-all hover:shadow-soft group">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <img
            src={primaryImage}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 bg-primary-500/95 text-white rounded-lg px-3 py-1.5 text-sm font-semibold shadow-soft">
            {formattedPrice}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg text-foreground truncate mb-1">
            {property.title}
          </h3>
          <div className="flex items-center text-sm text-subtext mb-3">
            <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{property.city} • {property.status.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
            {property.square_feet && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{property.square_feet} sq ft</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
