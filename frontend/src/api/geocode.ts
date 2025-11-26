import api from '@/lib/axios';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const res = await api.get('/api/v1/properties/geocode/', {
    params: { address }
  });
  return res.data;
}
