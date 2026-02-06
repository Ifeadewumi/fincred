import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Input } from '@/components/ui';
import { colors, spacing, borderRadius } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSnapshot } from '@/hooks/useSnapshot';
import { goalsApi } from '@/services/api/goals';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addMonths, differenceInMonths, format, parseISO } from 'date-fns';

export default function AdjustGoalScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const goalId = params.id as string;
    const { snapshot } = useSnapshot();
    const queryClient = useQueryClient();

    const { data: goal, isLoading } = useQuery({
        queryKey: ['goal', goalId],
        queryFn: () => goalsApi.getById(goalId),
        enabled: !!goalId,
    });

    const [targetAmount, setTargetAmount] = useState(0);
    const [months, setMonths] = useState(12);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (goal) {
            setTargetAmount(goal.target_amount);
            const monthsDiff = Math.max(1, differenceInMonths(parseISO(goal.target_date), new Date()));
            setMonths(monthsDiff);
        }
    }, [goal]);

    // Derived state
    const monthlyContribution = targetAmount / (months || 1);
    const surplus = (snapshot?.income?.amount || 0) - (snapshot?.expenses?.total_amount || 0);
    const remainingParams = surplus - monthlyContribution;

    // Feasibility calculation (Same as Review Screen)
    let status: 'comfortable' | 'tight' | 'unrealistic' = 'comfortable';
    let statusColor = colors.success;
    let statusText = 'Comfortable';
    let explanation = '';

    if (remainingParams < 0) {
        status = 'unrealistic';
        statusColor = colors.danger;
        statusText = 'Unrealistic';
        explanation = `Short by $${Math.abs(remainingParams).toFixed(0)}/mo.`;
    } else if (remainingParams < 100) {
        status = 'tight';
        statusColor = colors.warning;
        statusText = 'Tight';
        explanation = `Leftover: $${remainingParams.toFixed(0)}/mo.`;
    } else {
        explanation = `Surplus: $${remainingParams.toFixed(0)}/mo.`;
    }

    const handleUpdate = async () => {
        try {
            setIsSubmitting(true);
            const newTargetDate = addMonths(new Date(), months);

            await goalsApi.update(goalId, {
                target_amount: targetAmount,
                target_date: newTargetDate.toISOString().split('T')[0],
            });

            await queryClient.invalidateQueries({ queryKey: ['goals'] });
            await queryClient.invalidateQueries({ queryKey: ['goal', goalId] });

            Alert.alert('Success', 'Goal plan updated!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Failed to update goal:', error);
            Alert.alert('Error', 'Failed to update goal.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !goal) {
        return <View style={styles.centered}><Text>Loading...</Text></View>;
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text variant="h3">Adjust Plan</Text>
                <View style={{ width: 24 }} />
            </View>

            <Text variant="h2" style={styles.goalName}>{goal.name}</Text>

            {/* Visualization */}
            <Card style={[styles.verdictCard, { borderColor: statusColor, backgroundColor: statusColor + '10' }]}>
                <View style={styles.row}>
                    <View>
                        <Text variant="caption" color={colors.textSecondary}>Monthly Need</Text>
                        <Text variant="h3">${monthlyContribution.toFixed(0)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusColor }]}>
                        <Text variant="caption" color={colors.white} style={{ fontWeight: 'bold' }}>{statusText}</Text>
                    </View>
                </View>
                <Text variant="bodySmall" style={styles.explanation}>{explanation}</Text>
            </Card>

            {/* Adjustments */}
            <View style={styles.adjustments}>
                <View style={styles.adjustmentRow}>
                    <View style={styles.adjustmentCol}>
                        <Text variant="label">Target Amount</Text>
                        <View style={styles.stepper}>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => setTargetAmount(Math.max(0, targetAmount - 100))}
                            >
                                <Ionicons name="remove" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <Text variant="h4">${targetAmount.toLocaleString()}</Text>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => setTargetAmount(targetAmount + 100)}
                            >
                                <Ionicons name="add" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.adjustmentRow}>
                    <View style={styles.adjustmentCol}>
                        <Text variant="label">Timeline (Months)</Text>
                        <View style={styles.stepper}>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => setMonths(Math.max(1, months - 1))}
                            >
                                <Ionicons name="remove" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <Text variant="h4">{months} mo</Text>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => setMonths(months + 1)}
                            >
                                <Ionicons name="add" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                        <Text variant="caption" align="center" color={colors.textSecondary} style={{ marginTop: 4 }}>
                            New Date: {format(addMonths(new Date(), months), 'MMM yyyy')}
                        </Text>
                    </View>
                </View>
            </View>

            <Button
                title="Save Changes"
                onPress={handleUpdate}
                loading={isSubmitting}
                size="lg"
                style={styles.button}
                variant={status === 'unrealistic' ? 'secondary' : 'primary'}
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
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
    },
    goalName: {
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    verdictCard: {
        padding: spacing.md,
        borderWidth: 2,
        marginBottom: spacing.xl,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    badge: {
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: 16,
    },
    explanation: {
        color: colors.textSecondary,
    },
    adjustments: {
        marginBottom: spacing.xxl,
    },
    adjustmentRow: {
        marginBottom: spacing.lg,
    },
    adjustmentCol: {
        width: '100%',
    },
    stepper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
        marginTop: spacing.xs,
    },
    stepBtn: {
        padding: spacing.sm,
        backgroundColor: colors.gray100,
        borderRadius: borderRadius.sm,
    },
    button: {
        marginTop: 'auto',
    },
});
