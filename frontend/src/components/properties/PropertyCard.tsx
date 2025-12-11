import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import type { Property } from '@/api/properties';
import { formatTZS } from '@/lib/currency';

interface PropertyCardProps {
  property: Property;
  viewMode?: 'grid' | 'list';
}

export function PropertyCard({ property, viewMode = 'grid' }: PropertyCardProps) {
  const primaryImage = property.media?.[0]?.Images || '/placeholder.svg';
  const formattedPrice = formatTZS(property.price);
  const isList = viewMode === 'list';

  return (
    <Link to={`/properties/${property.id}`} className="block h-full">
      <Card
        className={`overflow-hidden transition-all hover:shadow-soft group h-full ${isList ? 'flex flex-row' : 'flex flex-col'
          }`}
      >
        <div
          className={`relative bg-muted overflow-hidden ${isList ? 'w-1/3 min-w-[120px] md:w-64' : 'aspect-[16/9] w-full'
            }`}
        >
          <img
            src={primaryImage}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 bg-primary/95 text-white rounded-lg px-2 py-1 text-xs md:text-sm font-semibold shadow-sm">
            {formattedPrice}
          </div>
        </div>

        <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className={`font-semibold text-foreground truncate mb-1 ${isList ? 'text-base' : 'text-lg'}`}>
              {property.title}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <MapPin className="mr-1 h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">{property.city} • {property.status.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
            {!isList && property.square_feet && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{property.square_feet} sq ft</span>
              </div>
            )}
            {isList && (
              // Show area on list view only if space permits or just hide to save space
              <div className="hidden md:flex items-center gap-1">
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
