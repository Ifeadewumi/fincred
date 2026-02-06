import { api } from './client';
import type { ActionPlan, ActionPlanCreate, ActionPlanUpdate } from '@/types/actionPlan.types';

export const actionPlanApi = {
    /**
     * Get all action plans for the current user.
     */
    getAll: async (limit = 20, offset = 0): Promise<ActionPlan[]> => {
        const response = await api.get<ActionPlan[]>('/action-plans', {
            params: { limit, offset },
        });
        return response.data;
    },

    /**
     * Get a single action plan by ID.
     */
    getById: async (id: string): Promise<ActionPlan> => {
        const response = await api.get<ActionPlan>(`/action-plans/${id}`);
        return response.data;
    },

    /**
     * Create a new action plan for a goal.
     */
    create: async (goalId: string, data: ActionPlanCreate): Promise<ActionPlan> => {
        const response = await api.post<ActionPlan>(`/goals/${goalId}/action-plans`, data);
        return response.data;
    },

    /**
     * Update an existing action plan.
     */
    update: async (id: string, data: ActionPlanUpdate): Promise<ActionPlan> => {
        const response = await api.put<ActionPlan>(`/action-plans/${id}`, data);
        return response.data;
    },

    /**
     * Delete an action plan.
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/action-plans/${id}`);
    },

    /**
     * Get action plans for a specific goal.
     */
    getByGoalId: async (goalId: string): Promise<ActionPlan[]> => {
        const allPlans = await actionPlanApi.getAll(100);
        return allPlans.filter(plan => plan.goal_id === goalId);
    },
};
