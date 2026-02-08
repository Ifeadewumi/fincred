import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSnapshot } from '@/hooks/useSnapshot';
import { Snapshot } from '@/types/snapshot.types';

const { width } = Dimensions.get('window');

interface GoalTemplate {
    id: string;
    title: string;
    type: 'debt_payment' | 'savings_target' | 'investment';
    description: string;
    icon: string;
    recommended?: boolean;
    defaultTarget?: number;
    defaultDateMonths?: number;
}

export default function DiscoverScreen() {
    const router = useRouter();
    const { snapshot, isLoading } = useSnapshot();
    const [templates, setTemplates] = useState<GoalTemplate[]>([]);

    useEffect(() => {
        if (snapshot) {
            generateTemplates(snapshot);
        }
    }, [snapshot]);

    const generateTemplates = (data: Snapshot) => {
        const temps: GoalTemplate[] = [];

        // 1. Debt Logic
        const highInterestDebts = data.debts?.filter(d => d.interest_rate_annual > 10) || [];
        if (highInterestDebts.length > 0) {
            const topDebt = highInterestDebts.sort((a, b) => b.interest_rate_annual - a.interest_rate_annual)[0];
            temps.push({
                id: 'pay_off_debt',
                title: `Pay off ${topDebt.label || 'Debt'}`,
                type: 'debt_payment',
                description: `Save money by clearing your ${topDebt.interest_rate_annual}% interest rate debt.`,
                icon: 'trending-down',
                recommended: true,
                defaultTarget: topDebt.balance,
                defaultDateMonths: 12
            });
        } else if (data.debts && data.debts.length > 0) {
            temps.push({
                id: 'pay_off_debt_gen',
                title: 'Become Debt Free',
                type: 'debt_payment',
                description: 'Clear your outstanding balances.',
                icon: 'trending-down',
                defaultTarget: data.debts.reduce((acc, d) => acc + d.balance, 0),
                defaultDateMonths: 12
            });
        }

        // 2. Emergency Fund Logic
        const expenses = data.expenses?.total_amount || 0;
        const savings = data.savings?.reduce((acc, s) => acc + s.balance, 0) || 0;
        const targetEmergency = expenses * 3;

        if (savings < targetEmergency) {
            temps.push({
                id: 'emergency_fund',
                title: 'Build Emergency Fund',
                type: 'savings_target',
                description: `Aim for $${targetEmergency.toLocaleString()} (3 months of expenses) for safety.`,
                icon: 'shield-checkmark',
                recommended: temps.length === 0, // Recommend if no high interest debt
                defaultTarget: targetEmergency - savings,
                defaultDateMonths: 6
            });
        }

        // 3. General Savings
        temps.push({
            id: 'vacation',
            title: 'Dream Vacation',
            type: 'savings_target',
            description: 'Save for that trip you have always wanted.',
            icon: 'airplane',
            defaultTarget: 2000,
            defaultDateMonths: 12
        });

        temps.push({
            id: 'investment',
            title: 'Start Investing',
            type: 'investment',
            description: 'Grow your wealth for the long term.',
            icon: 'trending-up',
            defaultTarget: 10000,
            defaultDateMonths: 24
        });

        setTemplates(temps);
    };

    const handleSelectTemplate = (template: GoalTemplate) => {
        // Navigate to review with template params
        router.push({
            pathname: '/onboarding/review',
            params: {
                title: template.title,
                target_amount: template.defaultTarget?.toString(),
                target_date_months: template.defaultDateMonths?.toString(),
                type: template.type
            }
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text variant="h2" style={styles.header}>What's your focus?</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.subHeader}>
                Based on your snapshot, here are some goals we recommend.
            </Text>

            <View style={styles.grid}>
                {templates.map((template) => (
                    <TouchableOpacity
                        key={template.id}
                        activeOpacity={0.8}
                        onPress={() => handleSelectTemplate(template)}
                        style={styles.cardContainer}
                    >
                        <Card style={[styles.card, template.recommended && styles.recommendedCard]}>
                            {template.recommended && (
                                <View style={styles.badge}>
                                    <Text variant="caption" color={colors.white} style={styles.badgeText}>
                                        Recommended
                                    </Text>
                                </View>
                            )}
                            <View style={styles.iconContainer}>
                                <Ionicons name={template.icon as any} size={32} color={colors.primary} />
                            </View>
                            <Text variant="h4" style={styles.cardTitle}>{template.title}</Text>
                            <Text variant="caption" color={colors.textSecondary}>{template.description}</Text>
                        </Card>
                    </TouchableOpacity>
                ))}

                {/* Custom Goal */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push({
                        pathname: '/onboarding/review',
                        params: { type: 'custom' } // Handle custom in review or intermediate screen
                    })}
                    style={styles.cardContainer}
                >
                    <Card style={[styles.card, styles.customCard]}>
                        <View style={[styles.iconContainer, styles.customIcon]}>
                            <Ionicons name="add" size={32} color={colors.white} />
                        </View>
                        <Text variant="h4" style={styles.cardTitle}>Create Custom</Text>
                        <Text variant="caption" color={colors.textSecondary}>Set your own target.</Text>
                    </Card>
                </TouchableOpacity>
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
        paddingBottom: spacing.xxl,
    },
    header: {
        marginBottom: spacing.xs,
    },
    subHeader: {
        marginBottom: spacing.xl,
    },
    grid: {
        gap: spacing.md,
    },
    cardContainer: {
        marginBottom: spacing.sm,
    },
    card: {
        padding: spacing.lg,
        minHeight: 140,
        justifyContent: 'center',
    },
    recommendedCard: {
        borderWidth: 1.5,
        borderColor: colors.primary,
        backgroundColor: colors.primary + '05',
    },
    customCard: {
        borderStyle: 'dashed',
        borderColor: colors.gray300,
        backgroundColor: colors.gray50,
    },
    badge: {
        position: 'absolute',
        top: -10,
        right: 16,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontWeight: 'bold',
        fontSize: 10,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    customIcon: {
        backgroundColor: colors.gray400,
    },
    cardTitle: {
        marginBottom: spacing.xs,
    },
});
