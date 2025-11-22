import api from '@/lib/api';

export interface GeocodeResponse {
    latitude: number;
    longitude: number;
    formatted_address: string;
}

/**
 * Geocode an address to get coordinates
 */
export async function geocodeAddress(
    address: string,
    city?: string
): Promise<GeocodeResponse> {
    const response = await api.post('/properties/geocode/', { address, city });
    return response.data;
}
