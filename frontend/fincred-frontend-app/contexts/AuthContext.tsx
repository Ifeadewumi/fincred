import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '@/services/api/auth';
import { userApi } from '@/services/api/user';
import type { User, LoginRequest, SignupRequest } from '@/types/user.types';

// Platform-aware storage wrapper
const SecureStorage = {
    async getItemAsync(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return await SecureStore.getItemAsync(key);
    },

    async setItemAsync(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        return await SecureStore.setItemAsync(key, value);
    },

    async deleteItemAsync(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        return await SecureStore.deleteItemAsync(key);
    },
};

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    signup: (data: SignupRequest) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const token = await SecureStorage.getItemAsync('auth_token');
            if (token) {
                // Fetch current user
                const currentUser = await userApi.getMe();
                setUser(currentUser);
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            // Token might be invalid, clear it
            await SecureStorage.deleteItemAsync('auth_token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (data: LoginRequest) => {
        const response = await authApi.login(data);
        await SecureStorage.setItemAsync('auth_token', response.access_token);

        // Fetch the user profile immediately after login
        const currentUser = await userApi.getMe();
        setUser(currentUser);
    };

    const signup = async (data: SignupRequest) => {
        await authApi.signup(data);
        // After signup, we log them in automatically (they are auto-verified in dev)
        await login({ email: data.email, password: data.password });
    };

    const logout = async () => {
        await SecureStorage.deleteItemAsync('auth_token');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const currentUser = await userApi.getMe();
            setUser(currentUser);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                signup,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
