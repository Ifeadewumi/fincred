import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkinApi } from '@/services/api/checkin';
import type { CheckInCreate, CheckInUpdate } from '@/types/checkin.types';

export const useCheckins = () => {
    const queryClient = useQueryClient();

    const checkinsQuery = useQuery({
        queryKey: ['checkins'],
        queryFn: () => checkinApi.getAll(),
    });

    const createCheckinMutation = useMutation({
        mutationFn: checkinApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checkins'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    const updateCheckinMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: CheckInUpdate }) =>
            checkinApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['checkins'] });
            queryClient.invalidateQueries({ queryKey: ['checkin', variables.id] });
        },
    });

    const deleteCheckinMutation = useMutation({
        mutationFn: checkinApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checkins'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    return {
        checkins: checkinsQuery.data || [],
        isLoading: checkinsQuery.isLoading,
        error: checkinsQuery.error,
        refetch: checkinsQuery.refetch,
        createCheckin: createCheckinMutation.mutateAsync,
        updateCheckin: updateCheckinMutation.mutateAsync,
        deleteCheckin: deleteCheckinMutation.mutateAsync,
        isCreating: createCheckinMutation.isPending,
        isUpdating: updateCheckinMutation.isPending,
        isDeleting: deleteCheckinMutation.isPending,
    };
};

export const useCheckin = (id: string) => {
    return useQuery({
        queryKey: ['checkin', id],
        queryFn: () => checkinApi.getById(id),
        enabled: !!id,
    });
};

export const useLatestCheckin = () => {
    return useQuery({
        queryKey: ['checkins', 'latest'],
        queryFn: () => checkinApi.getLatest(),
    });
};
