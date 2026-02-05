import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Text, Button, Card } from '@/components/ui';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { colors, spacing } from '@/theme';
import { useGoal, useGoalProgress } from '@/hooks/useGoals';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function GoalDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { data: goal, isLoading: isLoadingGoal } = useGoal(id as string);
    const { progress, isLoading: isLoadingProgress } = useGoalProgress(id as string);

    if (isLoadingGoal || isLoadingProgress) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!goal) {
        return (
            <View style={styles.centered}>
                <Text variant="h3">Goal not found</Text>
                <Button title="Go Back" onPress={() => router.back()} style={styles.backButton} />
            </View>
        );
    }

    const progressPercent = progress?.percent_complete || 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <Stack.Screen
                options={{
                    title: goal.name,
                    headerShown: true,
                    headerBackTitle: 'Back',
                }}
            />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <StatusBadge status={goal.status.toLowerCase() as any} />
                    <Text variant="h2" style={styles.title}>{goal.name}</Text>
                    <Text variant="body" color={colors.textSecondary}>
                        Target: {goal.target_amount.toLocaleString()} by {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Text variant="h4" style={styles.cardTitle}>Progress</Text>
                    <View style={styles.progressHeader}>
                        <Text variant="h3">{progressPercent}%</Text>
                        <Text variant="bodySmall" color={colors.textSecondary}>
                            {progress?.current_amount.toLocaleString()} / {goal.target_amount.toLocaleString()}
                        </Text>
                    </View>
                    <ProgressBar progress={progressPercent / 100} height={12} />
                </Card>

                {goal.description && (
                    <View style={styles.section}>
                        <Text variant="h4" style={styles.sectionTitle}>Description</Text>
                        <Text variant="body">{goal.description}</Text>
                    </View>
                )}

                {goal.why_text && (
                    <View style={styles.section}>
                        <Text variant="h4" style={styles.sectionTitle}>Why this matters</Text>
                        <Text variant="body" italic>"{goal.why_text}"</Text>
                    </View>
                )}

                <View style={styles.actions}>
                    <Button
                        title="Update Progress"
                        onPress={() => {/* TODO: Open Update Progress Modal */ }}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Edit Goal"
                        variant="outline"
                        onPress={() => {/* TODO: Open Edit Goal Form */ }}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Delete Goal"
                        variant="ghost"
                        color={colors.danger}
                        onPress={() => {/* TODO: Confirm Delete */ }}
                        style={styles.actionButton}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.md,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        marginTop: spacing.md,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.md,
    },
    title: {
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    card: {
        marginBottom: spacing.lg,
    },
    cardTitle: {
        marginBottom: spacing.md,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: spacing.sm,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        marginBottom: spacing.sm,
    },
    actions: {
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
    actionButton: {
        marginBottom: spacing.md,
    },
});
