import { api } from './client';
import type {
    NudgeSchedule,
    NudgeScheduleCreate,
    NudgeScheduleUpdate,
} from '@/types/notification.types';

export const notificationApi = {
    /**
     * Get all nudge schedules for the current user.
     */
    getAll: async (limit = 20, offset = 0): Promise<NudgeSchedule[]> => {
        const response = await api.get<NudgeSchedule[]>('/notifications', {
            params: { limit, offset },
        });
        return response.data;
    },

    /**
     * Get a single nudge schedule by ID.
     */
    getById: async (id: string): Promise<NudgeSchedule> => {
        const response = await api.get<NudgeSchedule>(`/notifications/${id}`);
        return response.data;
    },

    /**
     * Create a new nudge schedule.
     */
    create: async (data: NudgeScheduleCreate): Promise<NudgeSchedule> => {
        const response = await api.post<NudgeSchedule>('/notifications', data);
        return response.data;
    },

    /**
     * Update an existing nudge schedule.
     */
    update: async (id: string, data: NudgeScheduleUpdate): Promise<NudgeSchedule> => {
        const response = await api.put<NudgeSchedule>(`/notifications/${id}`, data);
        return response.data;
    },

    /**
     * Delete a nudge schedule.
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/notifications/${id}`);
    },
};
