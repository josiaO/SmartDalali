import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchProperties,
    fetchProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    type PropertyFilters,
    type PropertyFormData,
} from '@/api/properties';
import { useUI } from '@/contexts/UIContext';

export function useProperties(filters?: PropertyFilters) {
    const { showError, showSuccess } = useUI();
    const queryClient = useQueryClient();

    // Fetch properties list with filters
    const {
        data: properties = [],
        isLoading,
        error,
    } = useQuery({
        queryKey: ['properties', filters],
        queryFn: () => fetchProperties(filters),
    });

    // Fetch single property
    const useProperty = (id: string) => {
        return useQuery({
            queryKey: ['property', id],
            queryFn: () => fetchProperty(id),
            enabled: !!id,
        });
    };

    // Create property mutation
    const createMutation = useMutation({
        mutationFn: (data: PropertyFormData) => createProperty(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            showSuccess('Property created successfully');
        },
        onError: (error: any) => {
            showError(error.message || 'Failed to create property');
        },
    });

    // Update property mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PropertyFormData> }) =>
            updateProperty(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            queryClient.invalidateQueries({ queryKey: ['property', variables.id] });
            showSuccess('Property updated successfully');
        },
        onError: (error: any) => {
            showError(error.message || 'Failed to update property');
        },
    });

    // Delete property mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteProperty(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            showSuccess('Property deleted successfully');
        },
        onError: (error: any) => {
            showError(error.message || 'Failed to delete property');
        },
    });

    return {
        properties,
        isLoading,
        error,
        useProperty,
        createProperty: createMutation.mutateAsync,
        updateProperty: updateMutation.mutateAsync,
        deleteProperty: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
