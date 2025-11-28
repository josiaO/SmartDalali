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
            <Card className="h-[600px] relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                {/* Mock Map Background */}
                <div className="absolute inset-0 opacity-50 dark:opacity-30" style={{
                    backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'grayscale(100%)'
                }}></div>

                {/* Mock Pins */}
                <div className="absolute top-1/3 left-1/4">
                    <MapPin className="h-8 w-8 text-red-500 drop-shadow-md animate-bounce" />
                </div>
                <div className="absolute top-1/2 left-1/2">
                    <MapPin className="h-8 w-8 text-red-500 drop-shadow-md animate-bounce delay-100" />
                </div>
                <div className="absolute bottom-1/3 right-1/3">
                    <MapPin className="h-8 w-8 text-red-500 drop-shadow-md animate-bounce delay-200" />
                </div>

                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1px]">
                    <div className="bg-background/90 p-6 rounded-xl shadow-lg max-w-md text-center border backdrop-blur-sm">
                        <MapPin className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">Interactive Map View</h3>
                        <p className="text-muted-foreground mb-6">
                            Explore properties geographically. This feature requires a Google Maps API key to be configured.
                        </p>
                        <div className="bg-muted p-3 rounded-md text-left font-mono text-xs mb-4 overflow-x-auto">
                            VITE_GOOGLE_MAPS_API_KEY=your_api_key
                        </div>
                        <Button variant="default" onClick={() => window.open('https://developers.google.com/maps/documentation/javascript/get-api-key', '_blank')}>
                            Get API Key
                        </Button>
                    </div>
                </div>
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
                            {(selectedProperty.main_image_url || selectedProperty.media?.[0]?.Images) && (
                                <img
                                    src={selectedProperty.main_image_url || selectedProperty.media?.[0]?.Images}
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
