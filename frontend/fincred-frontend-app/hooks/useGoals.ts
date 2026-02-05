import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '@/services/api/goals';
import type { CreateGoalRequest, UpdateGoalRequest } from '@/types/goal.types';

export const useGoals = () => {
    const queryClient = useQueryClient();

    const goalsQuery = useQuery({
        queryKey: ['goals'],
        queryFn: goalsApi.getAll,
    });

    const createGoalMutation = useMutation({
        mutationFn: goalsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });

    const updateGoalMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) =>
            goalsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });

    const deleteGoalMutation = useMutation({
        mutationFn: goalsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });

    return {
        goals: goalsQuery.data || [],
        isLoading: goalsQuery.isLoading,
        error: goalsQuery.error,
        createGoal: createGoalMutation.mutateAsync,
        updateGoal: updateGoalMutation.mutateAsync,
        deleteGoal: deleteGoalMutation.mutateAsync,
        isCreating: createGoalMutation.isPending,
        isUpdating: updateGoalMutation.isPending,
        isDeleting: deleteGoalMutation.isPending,
    };
};

export const useGoal = (id: string) => {
    return useQuery({
        queryKey: ['goal', id],
        queryFn: () => goalsApi.getById(id),
        enabled: !!id,
    });
};

export const useGoalProgress = (id: string) => {
    const queryClient = useQueryClient();

    const progressQuery = useQuery({
        queryKey: ['goalProgress', id],
        queryFn: () => goalsApi.getProgress(id),
        enabled: !!id,
    });

    const updateProgressMutation = useMutation({
        mutationFn: ({ amount }: { amount: number }) =>
            goalsApi.updateProgress(id, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goalProgress', id] });
        },
    });

    return {
        progress: progressQuery.data,
        isLoading: progressQuery.isLoading,
        updateProgress: updateProgressMutation.mutateAsync,
        isUpdating: updateProgressMutation.isPending,
    };
};
