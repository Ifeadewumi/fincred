import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Wizard, Text, Input, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useGoals } from '@/hooks/useGoals';
import { GoalType } from '@/types/goal.types';
import { Ionicons } from '@expo/vector-icons';

const GOAL_TYPES: { type: GoalType; label: string; icon: string; description: string }[] = [
    { type: 'SAVINGS', label: 'Savings', icon: 'wallet-outline', description: 'Emergency fund, big purchase, or vacation' },
    { type: 'DEBT_PAYOFF', label: 'Debt Payoff', icon: 'card-outline', description: 'Credit cards, loans, or mortgages' },
    { type: 'INVESTMENT', label: 'Investment', icon: 'trending-up-outline', description: 'Retirement or long-term wealth' },
    { type: 'CUSTOM', label: 'Other', icon: 'flag-outline', description: 'Anything else you want to track' },
];

export default function CreateGoalScreen() {
    const router = useRouter();
    const { createGoal } = useGoals();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const steps = [
        {
            title: 'What type of goal is this?',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    {GOAL_TYPES.map((item) => (
                        <TouchableOpacity
                            key={item.type}
                            style={[
                                styles.typeCard,
                                data.goal_type === item.type && styles.selectedTypeCard,
                            ]}
                            onPress={() => updateData({ goal_type: item.type })}
                        >
                            <View style={[styles.iconContainer, data.goal_type === item.type && styles.selectedIconContainer]}>
                                <Ionicons
                                    name={item.icon as any}
                                    size={24}
                                    color={data.goal_type === item.type ? colors.white : colors.primary}
                                />
                            </View>
                            <View style={styles.typeText}>
                                <Text variant="h4">{item.label}</Text>
                                <Text variant="bodySmall" color={colors.textSecondary}>{item.description}</Text>
                            </View>
                            {data.goal_type === item.type && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            ),
        },
        {
            title: 'Tell us a bit more',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    <Input
                        label="What are you naming this goal?"
                        placeholder="e.g. Dream House Fund"
                        value={data.name}
                        onChangeText={(text) => updateData({ name: text })}
                    />
                    <Input
                        label="How much do you need?"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={data.target_amount?.toString()}
                        onChangeText={(text) => updateData({ target_amount: parseFloat(text) || 0 })}
                    />
                </View>
            ),
        },
        {
            title: 'Timeline & Motivation',
            component: ({ data, updateData }: any) => (
                <View style={styles.stepContainer}>
                    <Input
                        label="When do you want to achieve this?"
                        placeholder="YYYY-MM-DD"
                        value={data.target_date}
                        onChangeText={(text) => updateData({ target_date: text })}
                    />
                    <Input
                        label="Why does this goal matter to you?"
                        placeholder="e.g. To give my family a better life"
                        multiline
                        numberOfLines={3}
                        value={data.why_text}
                        onChangeText={(text) => updateData({ why_text: text })}
                    />
                </View>
            ),
        },
    ];

    const handleComplete = async (data: any) => {
        try {
            setIsSubmitting(true);
            // Validations
            if (!data.name || !data.target_amount || !data.target_date || !data.goal_type) {
                alert('Please fill in all required fields');
                return;
            }

            await createGoal({
                ...data,
                priority: 'MEDIUM',
            });
            router.back();
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('Failed to create goal. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'New Goal', headerShown: true }} />
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
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.gray200,
        marginBottom: spacing.md,
        backgroundColor: colors.white,
    },
    selectedTypeCard: {
        borderColor: colors.primary,
        backgroundColor: colors.gray50,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    selectedIconContainer: {
        backgroundColor: colors.primary,
    },
    typeText: {
        flex: 1,
    },
});
