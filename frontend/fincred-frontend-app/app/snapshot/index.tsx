import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Wizard, Text, Input, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useSnapshot } from '@/hooks/useSnapshot';
import { Ionicons } from '@expo/vector-icons';

export default function SnapshotScreen() {
    const router = useRouter();
    const { createSnapshot, updateSnapshot, snapshot } = useSnapshot();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = [
        {
            title: 'Monthly Income',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    <Text variant="body" color={colors.textSecondary} style={styles.stepIntro}>
                        Total net income you receive each month after taxes.
                    </Text>
                    <Input
                        label="Net Monthly Income"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={data.net_monthly_income?.toString()}
                        onChangeText={(text) => updateData({ net_monthly_income: parseFloat(text) || 0 })}
                    />
                </View>
            ),
        },
        {
            title: 'Fixed Expenses',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    <Text variant="body" color={colors.textSecondary} style={styles.stepIntro}>
                        Essential bills like rent/mortgage, utilities, and transport.
                    </Text>
                    <Input
                        label="Total Fixed Expenses"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={data.total_fixed_expenses?.toString()}
                        onChangeText={(text) => updateData({ total_fixed_expenses: parseFloat(text) || 0 })}
                    />
                </View>
            ),
        },
        {
            title: 'Current Savings',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    <Text variant="body" color={colors.textSecondary} style={styles.stepIntro}>
                        How much do you currently have in all your savings accounts?
                    </Text>
                    <Input
                        label="Total Savings Balance"
                        placeholder="0.00"
                        keyboardType="numeric"
                        // We map this to savings_accounts: [{ label: 'Total', balance: value }]
                        value={data.savings_total?.toString()}
                        onChangeText={(text) => updateData({ savings_total: parseFloat(text) || 0 })}
                    />
                </View>
            ),
        },
        {
            title: 'Review',
            component: ({ data }: any) => (
                <View style={styles.stepContainer}>
                    <Card style={styles.reviewCard}>
                        <View style={styles.reviewRow}>
                            <Text variant="body">Net Income</Text>
                            <Text variant="h4">${data.net_monthly_income?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                            <Text variant="body">Fixed Expenses</Text>
                            <Text variant="h4">${data.total_fixed_expenses?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                            <Text variant="body">Total Savings</Text>
                            <Text variant="h4">${data.savings_total?.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.reviewRow, styles.surplusRow]}>
                            <Text variant="body" color={colors.primary}>Estimated Monthly Surplus</Text>
                            <Text variant="h3" color={colors.primary}>
                                ${(data.net_monthly_income - data.total_fixed_expenses)?.toLocaleString()}
                            </Text>
                        </View>
                    </Card>
                    <Text variant="caption" color={colors.textSecondary} align="center">
                        This information helps FinCred give you realistic goal timelines.
                    </Text>
                </View>
            ),
        },
    ];

    const handleComplete = async (data: any) => {
        try {
            setIsSubmitting(true);

            const payload = {
                net_monthly_income: data.net_monthly_income,
                total_fixed_expenses: data.total_fixed_expenses,
                savings_accounts: data.savings_total ? [{ label: 'Total Savings', balance: data.savings_total }] : [],
                incomes: [{ source: 'Primary Income', amount: data.net_monthly_income, frequency: 'monthly' as any }],
                expenses: [{ category: 'Fixed Expenses', amount: data.total_fixed_expenses }],
                debts: [],
            };

            if (snapshot) {
                await updateSnapshot(payload);
            } else {
                await createSnapshot(payload);
            }

            Alert.alert('Success', 'Your financial snapshot has been updated!');
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Failed to save snapshot:', error);
            Alert.alert('Error', 'Failed to save snapshot. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Financial Snapshot', headerShown: true }} />
            <Wizard
                steps={steps}
                onComplete={handleComplete}
                onCancel={() => router.back()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    stepContainer: {
        flex: 1,
        paddingTop: spacing.md,
    },
    stepIntro: {
        marginBottom: spacing.xl,
    },
    reviewCard: {
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    reviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    surplusRow: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
});
