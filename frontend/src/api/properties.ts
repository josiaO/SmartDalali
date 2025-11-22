import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { buildQueryString } from '@/lib/helpers';

export interface Property {
    id: number;
    title: string;
    description: string;
    price: number;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    square_feet?: number;
    address: string;
    city: string;
    state?: string;
    zip_code?: string;
    latitude?: number;
    longitude?: number;
    images: PropertyImage[];
    agent: Agent;
    created_at: string;
    updated_at: string;
    is_available: boolean;
}

export interface PropertyImage {
    id: number;
    image: string;
    is_primary: boolean;
}

export interface Agent {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
    profile_picture?: string;
}

export interface PropertyFilters {
    search?: string;
    city?: string;
    property_type?: string;
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
    bathrooms?: number;
    ordering?: string;
}

export interface PropertyFormData {
    title: string;
    description: string;
    price: number;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    square_feet?: number;
    address: string;
    city: string;
    state?: string;
    zip_code?: string;
    images?: File[];
}

/**
 * Fetch list of properties with optional filters
 */
export async function fetchProperties(filters?: PropertyFilters): Promise<Property[]> {
    const queryString = filters ? buildQueryString(filters) : '';
    const url = queryString
        ? `${API_ENDPOINTS.PROPERTIES.LIST}?${queryString}`
        : API_ENDPOINTS.PROPERTIES.LIST;

    const response = await api.get(url);
    return response.data;
}

/**
 * Fetch single property by ID
 */
export async function fetchProperty(id: string): Promise<Property> {
    const response = await api.get(API_ENDPOINTS.PROPERTIES.DETAIL(id));
    return response.data;
}

/**
 * Create a new property (Agent only)
 */
export async function createProperty(data: PropertyFormData): Promise<Property> {
    const formData = new FormData();

    // Append text fields
    Object.keys(data).forEach((key) => {
        if (key !== 'images') {
            const value = data[key as keyof PropertyFormData];
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        }
    });

    // Append images
    if (data.images && data.images.length > 0) {
        data.images.forEach((image, index) => {
            formData.append(`image_${index}`, image);
        });
    }

    const response = await api.post(API_ENDPOINTS.PROPERTIES.CREATE, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

/**
 * Update existing property (Agent only)
 */
export async function updateProperty(
    id: string,
    data: Partial<PropertyFormData>
): Promise<Property> {
    const formData = new FormData();

    // Append text fields
    Object.keys(data).forEach((key) => {
        if (key !== 'images') {
            const value = data[key as keyof PropertyFormData];
            if (value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        }
    });

    // Append images if provided
    if (data.images && data.images.length > 0) {
        data.images.forEach((image, index) => {
            formData.append(`image_${index}`, image);
        });
    }

    const response = await api.patch(API_ENDPOINTS.PROPERTIES.UPDATE(id), formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

/**
 * Delete property (Agent only)
 */
export async function deleteProperty(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.PROPERTIES.DELETE(id));
}
