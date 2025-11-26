import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Property } from '@/api/properties';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PropertyMapProps {
    properties: Property[];
}

const containerStyle = {
    width: '100%',
    height: '600px'
};

const defaultCenter = {
    lat: -1.2921, // Nairobi
    lng: 36.8219
};

export function PropertyMap({ properties }: PropertyMapProps) {
    const navigate = useNavigate();
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    if (!apiKey) {
        return (
            <Card className="h-[600px] flex flex-col items-center justify-center p-6 text-center bg-muted/20">
                <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Map Integration Ready</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                    To enable the map view, you need to add your Google Maps API Key to the environment variables.
                </p>
                <div className="bg-muted p-4 rounded-md text-left font-mono text-sm mb-6 w-full max-w-md overflow-x-auto">
                    VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
                </div>
                <Button variant="outline" onClick={() => window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank')}>
                    Get API Key
                </Button>
            </Card>
        );
    }

    if (loadError) {
        return (
            <Card className="h-[600px] flex items-center justify-center text-destructive">
                Error loading maps
            </Card>
        );
    }

    if (!isLoaded) {
        return (
            <Card className="h-[600px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                }}
            >
                {properties.map((property) => (
                    property.latitude && property.longitude ? (
                        <Marker
                            key={property.id}
                            position={{ lat: Number(property.latitude), lng: Number(property.longitude) }}
                            onClick={() => setSelectedProperty(property)}
                        />
                    ) : null
                ))}

                {selectedProperty && (
                    <InfoWindow
                        position={{
                            lat: Number(selectedProperty.latitude),
                            lng: Number(selectedProperty.longitude)
                        }}
                        onCloseClick={() => setSelectedProperty(null)}
                    >
                        <div className="p-2 max-w-xs">
                            {selectedProperty.images?.[0] && (
                                <img
                                    src={selectedProperty.images[0].image}
                                    alt={selectedProperty.title}
                                    className="w-full h-32 object-cover rounded mb-2"
                                />
                            )}
                            <h4 className="font-bold text-sm mb-1">{selectedProperty.title}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{selectedProperty.city}</p>
                            <p className="font-bold text-primary">KES {selectedProperty.price.toLocaleString()}</p>
                            <Button size="sm" className="w-full mt-2" onClick={() => navigate(`/properties/${selectedProperty.id}`)}>
                                View Details
                            </Button>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </Card>
    );
}
