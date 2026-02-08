import { api } from './client';
import type { CheckIn, CheckInCreate, CheckInUpdate } from '@/types/checkin.types';

export const checkinApi = {
    /**
     * Get all check-ins for the current user.
     */
    getAll: async (limit = 20, offset = 0): Promise<CheckIn[]> => {
        const response = await api.get<CheckIn[]>('/checkins', {
            params: { limit, offset },
        });
        return response.data;
    },

    /**
     * Get a single check-in by ID.
     */
    getById: async (id: string): Promise<CheckIn> => {
        const response = await api.get<CheckIn>(`/checkins/${id}`);
        return response.data;
    },

    /**
     * Create a new check-in.
     */
    create: async (data: CheckInCreate): Promise<CheckIn> => {
        const response = await api.post<CheckIn>('/checkins', data);
        return response.data;
    },

    /**
     * Update an existing check-in.
     */
    update: async (id: string, data: CheckInUpdate): Promise<CheckIn> => {
        const response = await api.put<CheckIn>(`/checkins/${id}`, data);
        return response.data;
    },

    /**
     * Delete a check-in.
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/checkins/${id}`);
    },

    /**
     * Get the most recent check-in.
     */
    getLatest: async (): Promise<CheckIn | null> => {
        const response = await api.get<CheckIn[]>('/checkins', {
            params: { limit: 1, offset: 0 },
        });
        return response.data[0] || null;
    },
};
