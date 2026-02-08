import { api } from './client';
import type { Goal, CreateGoalRequest, UpdateGoalRequest, GoalProgress } from '@/types/goal.types';

export const goalsApi = {
    getAll: async () => {
        const response = await api.get<Goal[]>('/goals');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Goal>(`/goals/${id}`);
        return response.data;
    },

    create: async (data: CreateGoalRequest) => {
        const response = await api.post<Goal>('/goals', data);
        return response.data;
    },

    update: async (id: string, data: UpdateGoalRequest) => {
        const response = await api.put<Goal>(`/goals/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/goals/${id}`);
    },

    getProgress: async (id: string) => {
        // Backend returns a list of progress records, we get the most recent one
        const response = await api.get<GoalProgress[]>(`/goals/${id}/progress?limit=1`);
        return response.data[0] || null;
    },

    updateProgress: async (id: string, amount: number) => {
        const response = await api.post(`/goals/${id}/progress`, {
            goal_id: id,
            current_balance: amount,
            source: 'manual_entry',
        });
        return response.data;
    },
};
