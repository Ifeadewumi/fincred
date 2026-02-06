import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { snapshotApi } from '@/services/api/snapshot';
import type { CreateSnapshotRequest } from '@/types/snapshot.types';

export const useSnapshot = () => {
    const queryClient = useQueryClient();

    const snapshotQuery = useQuery({
        queryKey: ['snapshot'],
        queryFn: snapshotApi.get,
        retry: false, // If it doesn't exist, we'll create it
    });

    const createSnapshotMutation = useMutation({
        mutationFn: snapshotApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snapshot'] });
        },
    });

    const updateSnapshotMutation = useMutation({
        mutationFn: snapshotApi.update,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['snapshot'] });
        },
    });

    return {
        snapshot: snapshotQuery.data,
        isLoading: snapshotQuery.isLoading,
        error: snapshotQuery.error,
        createSnapshot: createSnapshotMutation.mutateAsync,
        updateSnapshot: updateSnapshotMutation.mutateAsync,
        isCreating: createSnapshotMutation.isPending,
        isUpdating: updateSnapshotMutation.isPending,
    };
};
