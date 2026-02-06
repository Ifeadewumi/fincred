import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';

export default function SignupScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();

    const passwordStrength = useMemo(() => {
        if (!password) return { score: 0, label: '', color: colors.gray200 };

        let score = 0;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1; // Uppercase
        if (/[0-9]/.test(password)) score += 1; // Number
        if (/[^A-Za-z0-9]/.test(password)) score += 1; // Special char

        if (score <= 1) return { score: 1, label: 'Weak', color: colors.danger };
        if (score === 2) return { score: 2, label: 'Fair', color: colors.warning };
        if (score === 3) return { score: 3, label: 'Good', color: colors.success };
        return { score: 4, label: 'Strong', color: colors.primary };
    }, [password]);

    const handleSignup = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        try {
            setIsLoading(true);
            await signup({ email, password, full_name: fullName });
            router.replace('/(tabs)');
        } catch (err: any) {
            Alert.alert('Signup Failed', err.response?.data?.detail || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Start your financial journey</Text>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            autoComplete="name"
                            editable={!isLoading}
                        />

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
                            placeholder="Password (min 8 characters)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoComplete="password-new"
                            editable={!isLoading}
                        />

                        {/* Password Strength Meter */}
                        {password.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthBarContainer}>
                                    {[1, 2, 3, 4].map((step) => (
                                        <View
                                            key={step}
                                            style={[
                                                styles.strengthSegment,
                                                {
                                                    backgroundColor:
                                                        passwordStrength.score >= step
                                                            ? passwordStrength.color
                                                            : colors.gray200,
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                                    {passwordStrength.label}
                                </Text>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            autoComplete="password-new"
                            editable={!isLoading}
                        />

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Creating account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            disabled={isLoading}
                        >
                            <Text style={styles.link}>Already have an account? Log in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
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
    strengthContainer: {
        marginBottom: 16,
        marginTop: -8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    strengthBarContainer: {
        flexDirection: 'row',
        flex: 1,
        marginRight: 10,
        height: 6,
        gap: 4,
    },
    strengthSegment: {
        flex: 1,
        height: '100%',
        borderRadius: 3,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 45,
        textAlign: 'right',
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
