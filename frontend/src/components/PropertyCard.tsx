import { Bed, Bath, MapPin, Square, Heart } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Property } from "@/data/properties";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleClick = () => {
    navigate(`/properties/${property.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const isFeatured = property.featured_until && new Date(property.featured_until) > new Date();

  // Determine the image source
  const imageUrl = property.main_image_url || (property.MediaProperty && property.MediaProperty.length > 0 ? property.MediaProperty[0].Images : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800');

  return (
    <Card className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-border/50" onClick={handleClick}>
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Top Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          {isFeatured && (
            <Badge className="bg-gradient-to-r from-primary to-accent text-white shadow-md">
              ⭐ Featured
            </Badge>
          )}
          <Button
            size="icon"
            variant="secondary"
            className={`ml-auto shadow-md transition-all ${isFavorite ? 'bg-red-100' : 'bg-white/80 hover:bg-white'}`}
            onClick={handleFavoriteClick}
          >
            <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
        </div>

        {/* Bottom Type Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <Badge variant="secondary" className="capitalize font-medium shadow-md">
            {property.type}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        {/* Title and Location */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{property.city}</span>
          </div>
        </div>

        {/* Price - Prominent */}
        <div className="py-2 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 px-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TSh {property.price.toLocaleString()}
          </div>
          {property.status === "rented" && (
            <span className="text-xs text-muted-foreground font-medium">/month</span>
          )}
        </div>

        {/* Stats - Bottom */}
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground pt-3 border-t border-border/50">
          {property.bedrooms > 0 && (
            <div className="flex items-center gap-1 flex-1">
              <Bed className="w-4 h-4 flex-shrink-0 text-primary" />
              <span className="font-medium">{property.bedrooms} bed</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1 flex-1">
              <Bath className="w-4 h-4 flex-shrink-0 text-accent" />
              <span className="font-medium">{property.bathrooms} bath</span>
            </div>
          )}
          <div className="flex items-center gap-1 flex-1">
            <Square className="w-4 h-4 flex-shrink-0 text-info" />
            <span className="font-medium">{property.area}m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
