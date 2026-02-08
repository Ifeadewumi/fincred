import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snapshotApi } from '@/services/api/snapshot';
import type { SnapshotPutRequest } from '@/types/snapshot.types';

export const useSnapshot = () => {
    const queryClient = useQueryClient();

    const snapshotQuery = useQuery({
        queryKey: ['snapshot'],
        queryFn: snapshotApi.get,
        retry: false, // If it doesn't exist, we'll create it
    });

    const saveMutation = useMutation({
        mutationFn: snapshotApi.save,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snapshot'] });
        },
    });

    return {
        snapshot: snapshotQuery.data,
        isLoading: snapshotQuery.isLoading,
        error: snapshotQuery.error,
        saveSnapshot: saveMutation.mutateAsync,
        isSaving: saveMutation.isPending,
    };
};
