import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Text, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '@/services/api/chat';
import { useCheckins } from '@/hooks/useCheckins';

export default function CheckinFeedbackScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const checkinId = params.id as string;
    const { checkins } = useCheckins();

    const [feedback, setFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const checkin = checkins?.find(c => c.id === checkinId);

    useEffect(() => {
        if (checkinId && !feedback) {
            generateFeedback();
        }
    }, [checkinId]);

    const generateFeedback = async () => {
        try {
            setIsLoading(true);
            // Simulate AI delay for better UX if needed, or just call API
            // In a real app, we might pass the check-in data to the chat context
            // For now, we'll send a prompt to the chat API

            const response = await chatApi.sendMessage({
                message: `I just completed a check-in. Mood: ${checkin?.mood_score}/5. Payments made: ${checkin?.made_planned_payments}. Spending: ${checkin?.spending_vs_plan}. Please give me brief, encouraging feedback.`,
                session_id: 'checkin_feedback_session' // Using a temporary/special session ID or letting backend handle it
            });

            setFeedback(response.response); // Assuming response structure
        } catch (error) {
            console.error('Failed to get AI feedback:', error);
            setFeedback("Great job on checking in! Consistency is key to reaching your financial goals. Keep it up!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                </View>
                <Text variant="h2" align="center" style={styles.title}>Check-in Complete!</Text>
                <Text variant="body" align="center" color={colors.textSecondary}>
                    Another week tracked. You're doing great.
                </Text>
            </View>

            <Card style={styles.feedbackCard}>
                <View style={styles.coachHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color={colors.white} />
                    </View>
                    <Text variant="h4">FinCred Coach</Text>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={colors.primary} />
                        <Text variant="caption" color={colors.textSecondary} style={{ marginTop: 8 }}>
                            Analyzing your progress...
                        </Text>
                    </View>
                ) : (
                    <Text variant="body" style={styles.feedbackText}>
                        {feedback}
                    </Text>
                )}
            </Card>

            <Button
                title="Back to Dashboard"
                onPress={() => router.replace('/(tabs)')}
                size="lg"
                style={styles.button}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
        paddingTop: spacing.xxl,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    iconContainer: {
        marginBottom: spacing.md,
    },
    title: {
        marginBottom: spacing.xs,
    },
    feedbackCard: {
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    coachHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    loadingContainer: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    feedbackText: {
        lineHeight: 24,
    },
    button: {
        marginTop: 'auto',
    },
});
