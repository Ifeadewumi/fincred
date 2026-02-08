import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Text, Button, Card, Input } from '@/components/ui';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { ProgressBar } from '@/components/feedback/ProgressBar';
import { colors, spacing } from '@/theme';
import { useGoal, useGoalProgress, useGoals } from '@/hooks/useGoals';
import { useGoalActionPlans } from '@/hooks/useActionPlans';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import type { ActionPlan } from '@/types/actionPlan.types';

export default function GoalDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { data: goal, isLoading: isLoadingGoal } = useGoal(id as string);
    const { progress, isLoading: isLoadingProgress } = useGoalProgress(id as string);
    const { data: actionPlans, isLoading: isLoadingActionPlans } = useGoalActionPlans(id as string);

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

    const [isUpdateModalVisible, setIsUpdateModalVisible] = React.useState(false);
    const [updateAmount, setUpdateAmount] = React.useState('');
    const { updateProgress, isUpdating: isUpdatingProgressAction } = useGoalProgress(id as string);
    const { deleteGoal, isDeleting } = useGoals();

    const handleUpdateProgress = async () => {
        if (!updateAmount || isNaN(parseFloat(updateAmount))) {
            Alert.alert('Error', 'Please enter a valid number');
            return;
        }
        try {
            await updateProgress({ amount: parseFloat(updateAmount) });
            setIsUpdateModalVisible(false);
            setUpdateAmount('');
            Alert.alert('Success', 'Progress updated successfully');
        } catch (error) {
            console.error('Failed to update progress:', error);
            Alert.alert('Error', 'Failed to update progress. Please try again.');
        }
    };

    const handleDeleteGoal = () => {
        const performDelete = async () => {
            try {
                await deleteGoal(id as string);
                router.replace('/(tabs)/goals');
            } catch (error) {
                console.error('Failed to delete goal:', error);
                Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
        };

        // Platform-agnostic confirmation
        if (typeof window !== 'undefined' && (window as any).confirm) {
            // Web fallback
            if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
                performDelete();
            }
        } else {
            // Native Alert
            Alert.alert(
                'Delete Goal',
                'Are you sure you want to delete this goal? This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: performDelete,
                    },
                ]
            );
        }
    };

    const handleEditGoal = () => {
        router.push(`/goal/edit/${id}` as any);
    };

    const progressPercent = goal.target_amount > 0
        ? Math.round(((progress?.current_balance || 0) / goal.target_amount) * 100)
        : 0;

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
                        Target: ${goal.target_amount?.toLocaleString() || '0'} by {format(new Date(goal.target_date), 'MMM d, yyyy')}
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Text variant="h4" style={styles.cardTitle}>Progress</Text>
                    <View style={styles.progressHeader}>
                        <Text variant="h3">{progressPercent}%</Text>
                        <Text variant="bodySmall" color={colors.textSecondary}>
                            ${progress?.current_balance?.toLocaleString() || '0'} / ${goal.target_amount?.toLocaleString() || '0'}
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
                        <Card variant="outline" style={styles.quoteCard}>
                            <Ionicons name="chatbubble" size={20} color={colors.primary} style={styles.quoteIcon} />
                            <Text variant="body" italic>"{goal.why_text}"</Text>
                        </Card>
                    </View>
                )}

                {/* Action Plans Section */}
                <View style={styles.section}>
                    <Text variant="h4" style={styles.sectionTitle}>Action Plans</Text>
                    {isLoadingActionPlans ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : actionPlans && actionPlans.length > 0 ? (
                        actionPlans.map((plan: ActionPlan) => (
                            <Card key={plan.id} variant="outline" style={styles.actionPlanCard}>
                                <View style={styles.actionPlanHeader}>
                                    <View style={[styles.planTypeIcon, { backgroundColor: getPlanTypeColor(plan.type) + '15' }]}>
                                        <Ionicons
                                            name={getPlanTypeIcon(plan.type)}
                                            size={18}
                                            color={getPlanTypeColor(plan.type)}
                                        />
                                    </View>
                                    <View style={styles.actionPlanInfo}>
                                        <Text variant="body">{getPlanTypeLabel(plan.type)}</Text>
                                        <Text variant="caption" color={colors.textSecondary}>
                                            ${plan.amount.toLocaleString()} • {getFrequencyLabel(plan.frequency)}
                                        </Text>
                                    </View>
                                    {plan.is_confirmed_set_up && (
                                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                    )}
                                </View>
                            </Card>
                        ))
                    ) : (
                        <Card variant="outline" style={styles.emptyActionPlans}>
                            <Ionicons name="clipboard-outline" size={32} color={colors.gray400} />
                            <Text variant="bodySmall" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
                                No action plans yet
                            </Text>
                        </Card>
                    )}
                </View>

                <View style={styles.actions}>
                    <Button
                        title="Update Progress"
                        onPress={() => setIsUpdateModalVisible(true)}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Edit Goal"
                        variant="outline"
                        onPress={handleEditGoal}
                        style={styles.actionButton}
                    />
                    <Button
                        title="Delete Goal"
                        variant="danger"
                        onPress={handleDeleteGoal}
                        loading={isDeleting}
                        style={styles.actionButton}
                    />
                </View>
            </ScrollView>

            <Modal
                visible={isUpdateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsUpdateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text variant="h3" style={styles.modalTitle}>Update Progress</Text>
                        <Text variant="body" color={colors.textSecondary} style={styles.modalSubtitle}>
                            Enter the total amount saved or paid off so far.
                        </Text>
                        <Input
                            label="Current Amount"
                            placeholder="0.00"
                            keyboardType="numeric"
                            value={updateAmount}
                            onChangeText={setUpdateAmount}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="ghost"
                                onPress={() => setIsUpdateModalVisible(false)}
                                style={styles.modalButton}
                            />
                            <Button
                                title="Update"
                                onPress={handleUpdateProgress}
                                loading={isUpdatingProgressAction}
                                style={styles.modalButton}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: colors.background,
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
    quoteCard: {
        padding: spacing.md,
        backgroundColor: colors.gray100 + '30',
    },
    quoteIcon: {
        marginBottom: spacing.xs,
        opacity: 0.5,
    },
    actions: {
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
    actionButton: {
        marginBottom: spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: spacing.lg,
        elevation: 5,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalTitle: {
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        marginBottom: spacing.lg,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: spacing.lg,
    },
    modalButton: {
        marginLeft: spacing.md,
        minWidth: 100,
    },
    actionPlanCard: {
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    actionPlanHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planTypeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionPlanInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    emptyActionPlans: {
        alignItems: 'center',
        padding: spacing.lg,
    },
});

// Helper functions for action plans
function getPlanTypeIcon(type: string): any {
    switch (type) {
        case 'savings_transfer': return 'wallet-outline';
        case 'debt_payment': return 'card-outline';
        case 'budget_check': return 'calculator-outline';
        default: return 'clipboard-outline';
    }
}

function getPlanTypeLabel(type: string): string {
    switch (type) {
        case 'savings_transfer': return 'Savings Transfer';
        case 'debt_payment': return 'Debt Payment';
        case 'budget_check': return 'Budget Check';
        default: return type;
    }
}

function getPlanTypeColor(type: string): string {
    switch (type) {
        case 'savings_transfer': return colors.success;
        case 'debt_payment': return colors.warning;
        case 'budget_check': return colors.primary;
        default: return colors.gray500;
    }
}

function getFrequencyLabel(frequency: string): string {
    switch (frequency) {
        case 'weekly': return 'Weekly';
        case 'bi_weekly': return 'Bi-weekly';
        case 'monthly': return 'Monthly';
        case 'daily': return 'Daily';
        default: return frequency;
    }
}
