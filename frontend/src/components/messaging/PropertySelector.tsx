import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Home, MapPin, Loader2 } from 'lucide-react';
import {
  fetchProperties,
  type Property,
  type PropertyFilters,
} from "@/api/properties";
import { formatTZS } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface PropertySelectorProps {
  onSelect: (property: Property) => void;
  currentPropertyId?: number | null;
  agentId?: number; // If provided, only show properties owned by this agent
  trigger?: React.ReactNode;
  className?: string;
}

export function PropertySelector({
  onSelect,
  currentPropertyId,
  agentId,
  trigger,
  className,
}: PropertySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Fetch properties - if agentId is provided, filter by owner; otherwise show all properties
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['properties', 'selector', agentId],
    queryFn: async () => {
      const params: PropertyFilters = { page_size: 50, is_published: true };
      if (agentId) {
        params.owner = agentId;
      }
      const data = await fetchProperties(params);
      return data.results || [];
    },
    enabled: open, // Only fetch when dialog is open
  });

  const properties = propertiesData || [];
  
  const filteredProperties = properties.filter((property) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      property.title.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.address?.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (property: Property) => {
    onSelect(property);
    setOpen(false);
    setSearchTerm('');
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className={className}>
      <Home className="h-4 w-4 mr-2" />
      {currentPropertyId ? 'Change Property' : 'Attach Property'}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {agentId ? 'Select Agent\'s Property' : 'Select a Property'}
          </DialogTitle>
          {agentId && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing only properties from the agent you're chatting with
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Properties List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{searchTerm ? 'No properties found' : 'No properties available'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProperties.map((property) => {
                  const isSelected = currentPropertyId === parseInt(property.id);
                  const mainImage = property.main_image_url || property.media?.[0]?.Images;

                  return (
                    <button
                      key={property.id}
                      onClick={() => handleSelect(property)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-all',
                        'hover:bg-accent hover:border-primary',
                        isSelected && 'bg-primary/10 border-primary'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Property Image */}
                        <div className="flex-shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Property Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{property.title}</h4>
                            {isSelected && (
                              <Badge variant="default" className="flex-shrink-0 text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{property.city}</span>
                            {property.address && (
                              <>
                                <span>•</span>
                                <span className="truncate">{property.address}</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-primary">
                              {formatTZS(property.price)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {property.type}
                            </Badge>
                            {property.bedrooms > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {property.bedrooms} bed • {property.bathrooms} bath
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

