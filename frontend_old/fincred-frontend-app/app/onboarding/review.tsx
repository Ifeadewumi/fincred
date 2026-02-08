import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Input } from '@/components/ui';
import { colors, spacing, borderRadius } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSnapshot } from '@/hooks/useSnapshot';
import { goalsApi } from '@/services/api/goals';
import { addMonths, format } from 'date-fns';

export default function ReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { snapshot } = useSnapshot();

    const [title, setTitle] = useState(params.title as string || 'New Goal');
    const [targetAmount, setTargetAmount] = useState(parseFloat(params.target_amount as string) || 1000);
    const [months, setMonths] = useState(parseInt(params.target_date_months as string) || 12);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived state
    const monthlyContribution = targetAmount / (months || 1);
    const surplus = (snapshot?.income?.amount || 0) - (snapshot?.expenses?.total_amount || 0);
    const remainingParams = surplus - monthlyContribution;

    // Feasibility status
    let status: 'comfortable' | 'tight' | 'unrealistic' = 'comfortable';
    let statusColor = colors.success;
    let statusText = 'Comfortable';
    let explanation = '';

    if (remainingParams < 0) {
        status = 'unrealistic';
        statusColor = colors.danger;
        statusText = 'Unrealistic';
        explanation = `You're short by $${Math.abs(remainingParams).toFixed(0)}/mo based on your current surplus.`;
    } else if (remainingParams < 100) {
        status = 'tight';
        statusColor = colors.warning;
        statusText = 'Tight';
        explanation = `You'll have about $${remainingParams.toFixed(0)} left over each month. Strict budgeting required!`;
    } else {
        explanation = `You have plenty of wiggle room ($${remainingParams.toFixed(0)} surplus). Great job!`;
    }

    const handleCreateGoal = async () => {
        try {
            setIsSubmitting(true);
            const targetDate = addMonths(new Date(), months);

            // Map frontend type to backend GoalType
            let goalType = 'short_term_saving';
            const paramType = params.type as string;

            if (paramType === 'debt_payment') goalType = 'debt_payoff';
            else if (paramType === 'investment') goalType = 'fire_starter';
            else if (title.toLowerCase().includes('emergency')) goalType = 'emergency_fund';

            const goal = await goalsApi.create({
                name: title,
                target_amount: targetAmount,
                target_date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD
                type: goalType as any,
                priority: 'High', // Default for onboarding goal
            });

            // Navigate to Commitment
            router.push({
                pathname: '/onboarding/commitment',
                params: { goalId: goal.id }
            });

        } catch (error) {
            console.error('Failed to create goal:', error);
            Alert.alert('Error', 'Failed to create goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text variant="h2" align="center">Is this feasible?</Text>
                <Text variant="body" align="center" color={colors.textSecondary}>
                    We've crunched the numbers from your snapshot.
                </Text>
            </View>

            {/* Verdict Card */}
            <Card style={[styles.verdictCard, { borderColor: statusColor, backgroundColor: statusColor + '10' }]}>
                <View style={[styles.badge, { backgroundColor: statusColor }]}>
                    <Text variant="h4" color={colors.white}>{statusText}</Text>
                </View>
                <Text variant="h3" align="center" style={styles.monthlyAmount}>
                    ${monthlyContribution.toFixed(0)} / mo
                </Text>
                <Text variant="body" align="center" style={styles.explanation}>
                    {explanation}
                </Text>

                {status === 'tight' && (
                    <View style={styles.tipContainer}>
                        <Ionicons name="bulb" size={20} color={colors.warning} />
                        <Text variant="caption" style={styles.tipText}>
                            Tip: Try extending the timeline by a few months to lower the monthly payment.
                        </Text>
                    </View>
                )}
            </Card>

            {/* Adjustments */}
            <View style={styles.adjustments}>
                <Text variant="h4" style={styles.sectionTitle}>Adjust Plan</Text>

                <Input
                    label="Goal Name"
                    value={title}
                    onChangeText={setTitle}
                />

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
                            Target Date: {format(addMonths(new Date(), months), 'MMM yyyy')}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Button
                    title={status === 'unrealistic' ? 'Update & Continue' : 'Looks Good'}
                    onPress={handleCreateGoal}
                    loading={isSubmitting}
                    size="lg"
                    style={styles.mainButton}
                    variant={status === 'unrealistic' ? 'secondary' : 'primary'}
                />
            </View>
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
    header: {
        marginBottom: spacing.lg,
    },
    verdictCard: {
        alignItems: 'center',
        padding: spacing.xl,
        borderWidth: 2,
        marginBottom: spacing.xl,
    },
    badge: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xs,
        borderRadius: 20,
        marginBottom: spacing.md,
    },
    monthlyAmount: {
        marginBottom: spacing.sm,
        fontSize: 32,
    },
    explanation: {
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    tipContainer: {
        flexDirection: 'row',
        backgroundColor: colors.warning + '20',
        padding: spacing.sm,
        borderRadius: 8,
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    tipText: {
        flex: 1,
    },
    adjustments: {
        marginBottom: spacing.xxl,
    },
    sectionTitle: {
        marginBottom: spacing.md,
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
    footer: {
        marginBottom: spacing.xl,
    },
    mainButton: {
        width: '100%',
    },
});
