import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { Text, Button, Input, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { actionPlanApi } from '@/services/api/actionPlan';

export default function SetupActionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const goalId = params.goalId as string;

    const [isAutomated, setIsAutomated] = useState(false); // Default to Manual for MVP as we don't have bank integration yet
    const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
    const [amount, setAmount] = useState('100');
    const [isSetupConfirmed, setIsSetupConfirmed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFinish = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.');
            return;
        }

        if (isAutomated && !isSetupConfirmed) {
            Alert.alert('Confirmation Required', 'Please confirm that you have set up the transfer in your bank app.');
            return;
        }

        try {
            setIsSubmitting(true);
            await actionPlanApi.create(goalId, {
                goal_id: goalId,
                type: isAutomated ? 'automated_transfer' : 'manual_habit',
                frequency: frequency,
                amount: parseFloat(amount),
                is_confirmed_set_up: isAutomated ? true : undefined
            });

            // Finish onboarding!
            Alert.alert('All Set!', 'Your plan is ready. Let\'s get to work!', [
                { text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error) {
            console.error('Failed to create action plan:', error);
            Alert.alert('Error', 'Failed to save action plan. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text variant="h2" align="center">Take Action</Text>
                <Text variant="body" align="center" color={colors.textSecondary}>
                    How will you fund this goal?
                </Text>
            </View>

            <Card style={styles.optionCard}>
                <View style={styles.optionHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={isAutomated ? "repeat" : "hand-left"} size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text variant="h4">{isAutomated ? 'Automated Transfer' : 'Manual Habit'}</Text>
                        <Text variant="caption" color={colors.textSecondary}>
                            {isAutomated ? 'Set it and forget it.' : 'I will move money myself.'}
                        </Text>
                    </View>
                    <Switch
                        value={isAutomated}
                        onValueChange={setIsAutomated}
                        trackColor={{ false: colors.gray200, true: colors.primary }}
                    />
                </View>

                {isAutomated && (
                    <View style={styles.educationBox}>
                        <Text variant="caption" color={colors.primary}>
                            Note: FinCred doesn't move money yet. You need to set this up in your banking app.
                        </Text>
                    </View>
                )}
            </Card>

            <View style={styles.form}>
                <Text variant="label">Frequency</Text>
                <View style={styles.frequencyRow}>
                    {['weekly', 'biweekly', 'monthly'].map((freq) => (
                        <TouchableOpacity
                            key={freq}
                            style={[
                                styles.freqOption,
                                frequency === freq && styles.freqOptionSelected
                            ]}
                            onPress={() => setFrequency(freq as any)}
                        >
                            <Text
                                color={frequency === freq ? colors.primary : colors.text}
                                style={styles.freqText}
                            >
                                {freq.charAt(0).toUpperCase() + freq.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Input
                    label="Amount per transfer"
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    style={styles.amountInput}
                />

                {isAutomated && (
                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setIsSetupConfirmed(!isSetupConfirmed)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.checkbox, isSetupConfirmed && styles.checkboxChecked]}>
                            {isSetupConfirmed && <Ionicons name="checkmark" size={16} color={colors.white} />}
                        </View>
                        <Text variant="body" style={styles.checkboxText}>
                            I have set up this standing order in my bank app.
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <Button
                title="Finish Setup"
                onPress={handleFinish}
                loading={isSubmitting}
                size="lg"
                style={styles.button}
                disabled={isAutomated && !isSetupConfirmed}
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
    header: {
        marginBottom: spacing.xl,
    },
    optionCard: {
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    optionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    educationBox: {
        marginTop: spacing.md,
        backgroundColor: colors.primary + '10',
        padding: spacing.sm,
        borderRadius: 8,
    },
    form: {
        marginBottom: spacing.xxl,
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
        marginTop: spacing.xs,
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
        fontSize: 12,
        fontWeight: '600',
    },
    amountInput: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
    },
    checkboxText: {
        flex: 1,
    },
    button: {
        marginTop: 'auto',
    },
});
