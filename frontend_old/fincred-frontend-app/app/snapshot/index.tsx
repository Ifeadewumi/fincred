import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Wizard, Text, Input, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useSnapshot } from '@/hooks/useSnapshot';
import { Ionicons } from '@expo/vector-icons';

export default function SnapshotScreen() {
    const router = useRouter();
    const { saveSnapshot, snapshot } = useSnapshot();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = [
        {
            title: 'Monthly Income',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    <Text variant="body" color={colors.textSecondary} style={styles.stepIntro}>
                        Total net income you receive after taxes.
                    </Text>
                    <Input
                        label="Net Income Amount"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={data.net_monthly_income?.toString()}
                        onChangeText={(text) => updateData({ net_monthly_income: parseFloat(text) || 0 })}
                    />

                    <Text variant="label" style={styles.label}>Pay Frequency</Text>
                    <View style={styles.frequencyRow}>
                        {['monthly', 'biweekly', 'weekly'].map((freq) => (
                            <TouchableOpacity
                                key={freq}
                                style={[
                                    styles.freqOption,
                                    data.pay_frequency === freq && styles.freqOptionSelected
                                ]}
                                onPress={() => updateData({ pay_frequency: freq })}
                            >
                                <Text
                                    color={data.pay_frequency === freq ? colors.primary : colors.text}
                                    style={styles.freqText}
                                >
                                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
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
            title: 'Debts',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    <Text variant="body" color={colors.textSecondary} style={styles.stepIntro}>
                        Do you have any improved debts (loans, credit cards)?
                    </Text>

                    {/* Simple debt list for now */}
                    {(data.debts || []).map((debt: any, index: number) => (
                        <Card key={index} style={styles.debtCard}>
                            <View style={styles.debtHeader}>
                                <Text variant="h4">{debt.label}</Text>
                                <TouchableOpacity onPress={() => {
                                    const newDebts = [...(data.debts || [])];
                                    newDebts.splice(index, 1);
                                    updateData({ debts: newDebts });
                                }}>
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                            <Text>${debt.balance?.toLocaleString()} @ {debt.interest_rate_annual}%</Text>
                        </Card>
                    ))}

                    <View style={styles.addDebtForm}>
                        <Input
                            label="Debt Name (e.g. Visa)"
                            placeholder="Debt Name"
                            value={data._tempDebtLabel}
                            onChangeText={(text) => updateData({ _tempDebtLabel: text })}
                        />
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Balance"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={data._tempDebtBalance}
                                    onChangeText={(text) => updateData({ _tempDebtBalance: text })}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Interest %"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={data._tempDebtRate}
                                    onChangeText={(text) => updateData({ _tempDebtRate: text })}
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Input
                                    label="Min Payment"
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={data._tempDebtMin}
                                    onChangeText={(text) => updateData({ _tempDebtMin: text })}
                                />
                            </View>
                        </View>
                        <Button
                            title="Add Debt"
                            variant="secondary"
                            onPress={() => {
                                if (!data._tempDebtLabel || !data._tempDebtBalance) return;
                                const newDebt = {
                                    label: data._tempDebtLabel,
                                    balance: parseFloat(data._tempDebtBalance) || 0,
                                    interest_rate_annual: parseFloat(data._tempDebtRate) || 0,
                                    min_payment: parseFloat(data._tempDebtMin) || 0,
                                    type: 'credit_card' // Default for now
                                };
                                updateData({
                                    debts: [...(data.debts || []), newDebt],
                                    _tempDebtLabel: '',
                                    _tempDebtBalance: '',
                                    _tempDebtRate: '',
                                    _tempDebtMin: ''
                                });
                            }}
                        />
                    </View>
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
                            <Text variant="body">Net Income ({data.pay_frequency || 'monthly'})</Text>
                            <Text variant="h4">${data.net_monthly_income?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                            <Text variant="body">Fixed Expenses</Text>
                            <Text variant="h4">${data.total_fixed_expenses?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                            <Text variant="body">Debts ({data.debts?.length || 0})</Text>
                            <Text variant="h4">${data.debts?.reduce((acc: number, d: any) => acc + d.balance, 0).toLocaleString()}</Text>
                        </View>
                        <View style={styles.reviewRow}>
                            <Text variant="body">Total Savings</Text>
                            <Text variant="h4">${data.savings_total?.toLocaleString()}</Text>
                        </View>
                    </Card>
                    <Text variant="caption" color={colors.textSecondary} align="center">
                        This looks like a solid starting point!
                    </Text>
                </View>
            ),
        },
    ];

    const handleComplete = async (data: any) => {
        try {
            setIsSubmitting(true);

            // Construct the payload to match backend SnapshotPutRequest
            const payload = {
                income: {
                    amount: data.net_monthly_income,
                    frequency: data.pay_frequency || 'monthly',
                    source_label: 'Primary Income'
                },
                expenses: {
                    total_amount: data.total_fixed_expenses
                },
                savings: data.savings_total ? [{ label: 'Total Savings', balance: data.savings_total }] : [],
                debts: data.debts || [],
            };

            await saveSnapshot(payload);

            // Navigate to Goal Discovery
            router.push('/onboarding/discover');
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
                completeButtonTitle="Generate Plan"
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
    label: {
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    freqOption: {
        flex: 1,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: 8,
        alignItems: 'center',
    },
    freqOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    freqText: {
        fontSize: 14,
        fontWeight: '600',
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
    addDebtForm: {
        marginTop: spacing.md,
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.gray50,
        borderRadius: 8,
    },
    debtCard: {
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    debtHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
});
