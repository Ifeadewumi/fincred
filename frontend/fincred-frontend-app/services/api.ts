// services/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper to determine the correct URL based on the device
const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Fallback logic for development
    if (Platform.OS === 'web') return 'http://localhost:8000';
    if (Platform.OS === 'android') return 'http://10.0.2.2:8000';

    // For iOS Simulator, localhost usually works, 
    // but using your machine's IP is safer for physical devices.
    return 'http://localhost:8000';
};

export const api = axios.create({
    baseURL: `${getBaseUrl()}/api/v0`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});