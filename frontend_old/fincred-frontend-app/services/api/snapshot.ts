import { api } from './client';
import type { FinancialSnapshot, SnapshotPutRequest } from '@/types/snapshot.types';

export const snapshotApi = {
    get: async () => {
        const response = await api.get<FinancialSnapshot>('/snapshot');
        return response.data;
    },

    save: async (data: SnapshotPutRequest) => {
        const response = await api.put<FinancialSnapshot>('/snapshot', data);
        return response.data;
    },
};
