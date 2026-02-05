import { api } from './client';
import type { FinancialSnapshot, CreateSnapshotRequest } from '@/types/snapshot.types';

export const snapshotApi = {
    get: async () => {
        const response = await api.get<FinancialSnapshot>('/snapshot');
        return response.data;
    },

    create: async (data: CreateSnapshotRequest) => {
        const response = await api.post<FinancialSnapshot>('/snapshot', data);
        return response.data;
    },

    update: async (data: Partial<CreateSnapshotRequest>) => {
        const response = await api.put<FinancialSnapshot>('/snapshot', data);
        return response.data;
    },
};
