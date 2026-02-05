import { api } from './client';
import type { LoginRequest, SignupRequest, AuthResponse, User } from '@/types/user.types';

export const authApi = {
    login: async (data: LoginRequest) => {
        const formData = new URLSearchParams();
        formData.append('username', data.email);
        formData.append('password', data.password);

        const response = await api.post<AuthResponse>('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data;
    },

    signup: async (data: SignupRequest) => {
        const response = await api.post<AuthResponse>('/auth/signup', data);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get<User>('/users/me');
        return response.data;
    },

    verifyEmail: async (token: string) => {
        const response = await api.post('/auth/verify-email', { token });
        return response.data;
    },

    resendVerification: async (email: string) => {
        const response = await api.post('/auth/resend-verification', { email });
        return response.data;
    },
};
