import api from '@/lib/axios';

export interface Feature {
    id: number;
    name: string;
    code: string;
    description: string;
    status: 'active' | 'coming_soon' | 'disabled';
    is_global: boolean;
}

export const getFeatures = async () => {
    const response = await api.get<any>('/api/v1/features/features/?page_size=100');
    if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
    }
    return Array.isArray(response.data) ? response.data : [];
};
