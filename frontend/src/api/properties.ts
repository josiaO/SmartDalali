import api from '@/lib/axios';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  rooms: number;
  area: number;
  type: string;
  status: string;
  parking: boolean;
  year_built: string | null;
  view_count: number;
  like_count: number;
  is_liked: boolean;
  media: Array<{ id: number; Images: string; videos: string | null; caption: string }>;
  main_image_url: string | null;
  agent: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    profile_picture?: string;
  };
  latitude?: number;
  longitude?: number;
  created_at: string;
  property_features?: Array<{ id: number; features: string }>;
}

export interface PropertyFilters {
  search?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  bedrooms?: number;
  ordering?: string;
  owner?: string;
  agent_id?: number;
}

export async function fetchProperties(params?: PropertyFilters) {
  const response = await api.get<{ results: Property[]; count: number }>('/api/v1/properties/', {
    params: { ...params, page_size: 100 }
  });
  return response.data;
}

export const getProperties = async () => {
  const response = await api.get<Property[]>('/api/v1/properties/?page_size=100');
  return response.data;
};

export const getLikedProperties = async () => {
  const response = await api.get<Property[]>('/api/v1/properties/liked/');
  return response.data;
};

export const getViewedProperties = async () => {
  const response = await api.get<Property[]>('/api/v1/properties/viewed/');
  return response.data;
};

export async function getPublicStats() {
  const response = await api.get('/api/v1/properties/public-stats/');
  return response.data;
}

export const getAgentStats = async () => {
  const response = await api.get('/api/v1/properties/agent-stats/');
  return response.data;
};

export async function getAgentProperties() {
  const response = await api.get('/api/v1/properties/agent-properties/');
  return response.data;
}

export async function updatePropertyStatus(propertyId: number, status: string) {
  const response = await api.patch(`/api/v1/properties/${propertyId}/`, { status });
  return response.data;
}

export async function deleteProperty(propertyId: number) {
  const response = await api.delete(`/api/v1/properties/${propertyId}/`);
  return response.data;
}

export async function fetchProperty(id: string) {
  const response = await api.get<Property>(`/api/v1/properties/${id}/`);
  return response.data;
}

export async function createProperty(formData: FormData) {
  const response = await api.post<Property>('/api/v1/properties/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function updateProperty(id: string, formData: FormData) {
  const response = await api.patch<Property>(`/api/v1/properties/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function geocodeAddress(address: string) {
  const response = await api.post('/api/v1/properties/geocode/', {
    address: address,
  });
  return response.data;
}

export interface PropertyVisitData {
  property: number;
  scheduled_time: string;
  notes?: string;
}

export async function createPropertyVisit(data: PropertyVisitData) {
  const response = await api.post('/api/v1/properties/visits/', data);
  return response.data;
}

export async function togglePropertyLike(propertyId: string) {
  const response = await api.post(`/api/v1/properties/${propertyId}/like/`);
  return response.data;
}

export async function trackPropertyView(propertyId: string) {
  const response = await api.post(`/api/v1/properties/${propertyId}/track-view/`);
  return response.data;
}
