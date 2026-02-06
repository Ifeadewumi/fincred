import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actionPlanApi } from '@/services/api/actionPlan';
import type { ActionPlanCreate, ActionPlanUpdate } from '@/types/actionPlan.types';

export const useActionPlans = () => {
    const queryClient = useQueryClient();

    const actionPlansQuery = useQuery({
        queryKey: ['actionPlans'],
        queryFn: () => actionPlanApi.getAll(),
    });

    const createActionPlanMutation = useMutation({
        mutationFn: ({ goalId, data }: { goalId: string; data: ActionPlanCreate }) =>
            actionPlanApi.create(goalId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['actionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['actionPlans', 'goal', variables.goalId] });
            queryClient.invalidateQueries({ queryKey: ['goal', variables.goalId] });
        },
    });

    const updateActionPlanMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ActionPlanUpdate }) =>
            actionPlanApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['actionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['actionPlan', variables.id] });
        },
    });

    const deleteActionPlanMutation = useMutation({
        mutationFn: actionPlanApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actionPlans'] });
        },
    });

    return {
        actionPlans: actionPlansQuery.data || [],
        isLoading: actionPlansQuery.isLoading,
        error: actionPlansQuery.error,
        refetch: actionPlansQuery.refetch,
        createActionPlan: createActionPlanMutation.mutateAsync,
        updateActionPlan: updateActionPlanMutation.mutateAsync,
        deleteActionPlan: deleteActionPlanMutation.mutateAsync,
        isCreating: createActionPlanMutation.isPending,
        isUpdating: updateActionPlanMutation.isPending,
        isDeleting: deleteActionPlanMutation.isPending,
    };
};

export const useActionPlan = (id: string) => {
    return useQuery({
        queryKey: ['actionPlan', id],
        queryFn: () => actionPlanApi.getById(id),
        enabled: !!id,
    });
};

export const useGoalActionPlans = (goalId: string) => {
    return useQuery({
        queryKey: ['actionPlans', 'goal', goalId],
        queryFn: () => actionPlanApi.getByGoalId(goalId),
        enabled: !!goalId,
    });
};
