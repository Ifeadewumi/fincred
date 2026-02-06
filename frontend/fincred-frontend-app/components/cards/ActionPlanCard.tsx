import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text } from '../ui';
import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ActionPlan, ActionPlanType, ActionPlanFrequency } from '@/types/actionPlan.types';

interface Props {
    actionPlan: ActionPlan;
    onPress?: () => void;
    showGoal?: boolean;
}

export const ActionPlanCard: React.FC<Props> = ({ actionPlan, onPress, showGoal = false }) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
            <Card variant="outline" style={styles.container}>
                <View style={styles.header}>
                    <View style={[styles.typeIcon, { backgroundColor: getTypeColor(actionPlan.type) + '15' }]}>
                        <Ionicons
                            name={getTypeIcon(actionPlan.type)}
                            size={20}
                            color={getTypeColor(actionPlan.type)}
                        />
                    </View>
                    <View style={styles.info}>
                        <Text variant="body">{getTypeLabel(actionPlan.type)}</Text>
                        <Text variant="caption" color={colors.textSecondary}>
                            ${actionPlan.amount.toLocaleString()} • {getFrequencyLabel(actionPlan.frequency)}
                        </Text>
                    </View>
                    {actionPlan.is_confirmed_set_up ? (
                        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    ) : (
                        <View style={styles.pendingBadge}>
                            <Text variant="caption" color={colors.warning}>Pending</Text>
                        </View>
                    )}
                </View>
                {actionPlan.next_action_date && (
                    <View style={styles.nextAction}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text variant="caption" color={colors.textSecondary} style={styles.nextActionText}>
                            Next: {formatDate(actionPlan.next_action_date)}
                        </Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
};

function getTypeIcon(type: ActionPlanType): any {
    switch (type) {
        case 'savings_transfer': return 'wallet-outline';
        case 'debt_payment': return 'card-outline';
        case 'budget_check': return 'calculator-outline';
        default: return 'clipboard-outline';
    }
}

function getTypeLabel(type: ActionPlanType): string {
    switch (type) {
        case 'savings_transfer': return 'Savings Transfer';
        case 'debt_payment': return 'Debt Payment';
        case 'budget_check': return 'Budget Check';
        default: return type;
    }
}

function getTypeColor(type: ActionPlanType): string {
    switch (type) {
        case 'savings_transfer': return colors.success;
        case 'debt_payment': return colors.warning;
        case 'budget_check': return colors.primary;
        default: return colors.gray500;
    }
}

function getFrequencyLabel(frequency: ActionPlanFrequency): string {
    switch (frequency) {
        case 'weekly': return 'Weekly';
        case 'bi_weekly': return 'Bi-weekly';
        case 'monthly': return 'Monthly';
        case 'daily': return 'Daily';
        default: return frequency;
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
    },
    pendingBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        backgroundColor: colors.warning + '15',
    },
    nextAction: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
    nextActionText: {
        marginLeft: spacing.xs,
    },
});
