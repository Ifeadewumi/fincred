import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.replace('/(tabs)');
            } else {
                router.replace('/landing');
            }
        }
    }, [isLoading, isAuthenticated]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return null;
}
