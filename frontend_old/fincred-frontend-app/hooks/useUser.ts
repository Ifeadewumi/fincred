import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api/user';
import type { UpdateProfileRequest } from '@/types/user.types';

export const useUser = () => {
    const queryClient = useQueryClient();

    const userQuery = useQuery({
        queryKey: ['user', 'me'],
        queryFn: userApi.getMe,
    });

    const updateProfileMutation = useMutation({
        mutationFn: userApi.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        },
    });

    return {
        user: userQuery.data,
        isLoading: userQuery.isLoading,
        error: userQuery.error,
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdating: updateProfileMutation.isPending,
    };
};
