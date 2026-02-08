// services/api.ts
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper to determine the correct URL based on the device
const getBaseUrl = () => {
    if (process.env.EXPO_PUBLIC_API_URL) {
        console.log('Using EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
        return process.env.EXPO_PUBLIC_API_URL;
    }

    const output = {
        web: 'http://localhost:8000',
    };

    if (Platform.OS !== 'web') {
        const debuggerHost = Constants.expoConfig?.hostUri;
        console.log('Debugger Host:', debuggerHost);
        const localhost = debuggerHost?.split(':')[0];
        if (localhost) {
            const url = `http://${localhost}:8000`;
            console.log('Derived Base URL:', url);
            return url;
        }
    }

    if (Platform.OS === 'android') {
        console.log('Fallback to Android Emulator URL');
        return 'http://10.0.2.2:8000';
    }

    console.log('Fallback to Web URL');
    return output.web;
};

export const api = axios.create({
    baseURL: `${getBaseUrl()}/api/v0`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});