// services/api/client.ts
import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Platform-aware storage wrapper
const SecureStorage = {
    async getItemAsync(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    },

    async deleteItemAsync(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        return await SecureStore.deleteItemAsync(key);
    },
};

const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Fallback logic for development
    if (Platform.OS === 'web') return 'http://localhost:8000';
    if (Platform.OS === 'android') return 'http://10.0.2.2:8000';

    // For iOS Simulator, localhost usually works
    return 'http://localhost:8000';
};

export const api = axios.create({
    baseURL: `${getBaseUrl()}/api/v0`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor - inject auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStorage.getItemAsync('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Failed to get auth token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid - clear it
            try {
                await SecureStorage.deleteItemAsync('auth_token');
            } catch (e) {
                console.error('Failed to delete auth token:', e);
            }
            // The AuthContext will handle redirecting to login
        }
        return Promise.reject(error);
    }
);
