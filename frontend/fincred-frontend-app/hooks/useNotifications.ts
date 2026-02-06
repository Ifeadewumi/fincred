import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/services/api/notification';
import type { NudgeScheduleCreate, NudgeScheduleUpdate } from '@/types/notification.types';

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationApi.getAll(),
    });

    const createNotificationMutation = useMutation({
        mutationFn: notificationApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const updateNotificationMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: NudgeScheduleUpdate }) =>
            notificationApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notification', variables.id] });
        },
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: notificationApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    return {
        notifications: notificationsQuery.data || [],
        isLoading: notificationsQuery.isLoading,
        error: notificationsQuery.error,
        refetch: notificationsQuery.refetch,
        createNotification: createNotificationMutation.mutateAsync,
        updateNotification: updateNotificationMutation.mutateAsync,
        deleteNotification: deleteNotificationMutation.mutateAsync,
        isCreating: createNotificationMutation.isPending,
        isUpdating: updateNotificationMutation.isPending,
        isDeleting: deleteNotificationMutation.isPending,
    };
};

export const useNotification = (id: string) => {
    return useQuery({
        queryKey: ['notification', id],
        queryFn: () => notificationApi.getById(id),
        enabled: !!id,
    });
};
