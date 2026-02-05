import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setIsLoading(true);
            await login({ email, password });
            router.replace('/(tabs)');
        } catch (err: any) {
            Alert.alert('Login Failed', err.response?.data?.detail || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to FinCred</Text>
                <Text style={styles.subtitle}>Your AI financial coach</Text>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        editable={!isLoading}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="password"
                        editable={!isLoading}
                    />

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/signup')}
                        disabled={isLoading}
                    >
                        <Text style={styles.link}>Don't have an account? Sign up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
        color: colors.text,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 48,
    },
    form: {
        width: '100%',
    },
    input: {
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
    },
    button: {
        backgroundColor: colors.primary,
        padding: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        color: colors.primary,
        textAlign: 'center',
        marginTop: 16,
        fontSize: 14,
    },
});
