import { api } from './client';
import type { DashboardResponse } from '@/types/dashboard.types';

export const dashboardApi = {
    /**
     * Get dashboard summary with goals, progress, and statistics.
     */
    getSummary: async (): Promise<DashboardResponse> => {
        const response = await api.get<DashboardResponse>('/dashboard');
        return response.data;
    },
};
