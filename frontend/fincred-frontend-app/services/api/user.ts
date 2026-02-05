import { api } from './client';
import type { User, UpdateProfileRequest } from '@/types/user.types';

export const userApi = {
    getMe: async () => {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    updateProfile: async (data: UpdateProfileRequest) => {
        const response = await api.put<User>('/users/me', data);
        return response.data;
    },
};
