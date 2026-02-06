import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCheckins } from '@/hooks/useCheckins';
import type { CheckInCreate, MoodScore, PlannedPayments, SpendingVsPlan } from '@/types/checkin.types';

type SelectableOption<T> = {
    value: T;
    label: string;
    icon?: string;
};

const paymentOptions: SelectableOption<PlannedPayments>[] = [
    { value: 'yes', label: 'Yes, all payments', icon: 'checkmark-circle' },
    { value: 'partial', label: 'Partially', icon: 'remove-circle' },
    { value: 'no', label: 'No', icon: 'close-circle' },
];

const spendingOptions: SelectableOption<SpendingVsPlan>[] = [
    { value: 'under', label: 'Under budget', icon: 'trending-down' },
    { value: 'on', label: 'On budget', icon: 'remove' },
    { value: 'over', label: 'Over budget', icon: 'trending-up' },
];

const moodOptions: { value: MoodScore; emoji: string; label: string }[] = [
    { value: 1, emoji: '😢', label: 'Very Bad' },
    { value: 2, emoji: '😕', label: 'Bad' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙂', label: 'Good' },
    { value: 5, emoji: '😄', label: 'Great' },
];

export default function CreateCheckinScreen() {
    const router = useRouter();
    const { createCheckin, isCreating } = useCheckins();

    const [payments, setPayments] = useState<PlannedPayments | null>(null);
    const [spending, setSpending] = useState<SpendingVsPlan | null>(null);
    const [mood, setMood] = useState<MoodScore | null>(null);
    const [comment, setComment] = useState('');

    const isFormValid = payments !== null && spending !== null && mood !== null;

    const handleSubmit = async () => {
        if (!isFormValid) {
            Alert.alert('Incomplete', 'Please answer all questions before submitting.');
            return;
        }

        try {
            const data: CheckInCreate = {
                made_planned_payments: payments!,
                spending_vs_plan: spending!,
                mood_score: mood!,
                comment: comment || undefined,
            };

            await createCheckin(data);
            Alert.alert('Success', 'Check-in recorded!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save check-in. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text variant="h3">Weekly Check-in</Text>
                    <View style={{ width: 24 }} />
                </View>

                <Text variant="bodySmall" color={colors.textSecondary} style={styles.subtitle}>
                    Take a moment to reflect on your week
                </Text>

                {/* Question 1: Payments */}
                <Card variant="outline" style={styles.questionCard}>
                    <Text variant="h4" style={styles.questionTitle}>
                        Did you make your planned payments?
                    </Text>
                    <View style={styles.optionsContainer}>
                        {paymentOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionButton,
                                    payments === option.value && styles.optionButtonSelected,
                                ]}
                                onPress={() => setPayments(option.value)}
                            >
                                <Ionicons
                                    name={option.icon as any}
                                    size={20}
                                    color={payments === option.value ? colors.white : colors.primary}
                                />
                                <Text
                                    variant="bodySmall"
                                    color={payments === option.value ? colors.white : colors.text}
                                    style={styles.optionLabel}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Question 2: Spending */}
                <Card variant="outline" style={styles.questionCard}>
                    <Text variant="h4" style={styles.questionTitle}>
                        How was your spending this week?
                    </Text>
                    <View style={styles.optionsContainer}>
                        {spendingOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.optionButton,
                                    spending === option.value && styles.optionButtonSelected,
                                ]}
                                onPress={() => setSpending(option.value)}
                            >
                                <Ionicons
                                    name={option.icon as any}
                                    size={20}
                                    color={spending === option.value ? colors.white : colors.primary}
                                />
                                <Text
                                    variant="bodySmall"
                                    color={spending === option.value ? colors.white : colors.text}
                                    style={styles.optionLabel}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Question 3: Mood */}
                <Card variant="outline" style={styles.questionCard}>
                    <Text variant="h4" style={styles.questionTitle}>
                        How are you feeling about your finances?
                    </Text>
                    <View style={styles.moodContainer}>
                        {moodOptions.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.moodButton,
                                    mood === option.value && styles.moodButtonSelected,
                                ]}
                                onPress={() => setMood(option.value)}
                            >
                                <Text style={styles.moodEmoji}>{option.emoji}</Text>
                                <Text
                                    variant="caption"
                                    color={mood === option.value ? colors.primary : colors.textSecondary}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Submit Button */}
                <Button
                    title={isCreating ? 'Saving...' : 'Complete Check-in'}
                    onPress={handleSubmit}
                    disabled={!isFormValid || isCreating}
                    style={styles.submitButton}
                />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    backButton: {
        padding: spacing.xs,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    questionCard: {
        marginBottom: spacing.lg,
        padding: spacing.md,
    },
    questionTitle: {
        marginBottom: spacing.md,
    },
    optionsContainer: {
        gap: spacing.sm,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.gray200,
        backgroundColor: colors.white,
    },
    optionButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    optionLabel: {
        marginLeft: spacing.sm,
        fontWeight: '500',
    },
    moodContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    moodButton: {
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        flex: 1,
    },
    moodButtonSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    moodEmoji: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    submitButton: {
        marginTop: spacing.md,
        marginBottom: spacing.xxl,
    },
});
