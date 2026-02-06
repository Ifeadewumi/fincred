import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text } from '../ui';
import { StatusBadge } from '../feedback/StatusBadge';
import { ProgressBar } from '../feedback/ProgressBar';
import { colors, spacing } from '@/theme';
import type { Goal } from '@/types/goal.types';
import { format } from 'date-fns';

interface Props {
    goal: Goal;
    progressPercent: number;
    onPress?: () => void;
}

export const GoalCard: React.FC<Props> = ({ goal, progressPercent, onPress }) => {
    const isCompleted = goal.status === 'completed';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Card style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text variant="h4" style={styles.title}>{goal.name}</Text>
                        <Text variant="caption" color={colors.textSecondary}>
                            Target: {goal.target_amount.toLocaleString()} • {format(new Date(goal.target_date), 'MMM yyyy')}
                        </Text>
                    </View>
                    <StatusBadge status={goal.status.toLowerCase() as any} />
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text variant="bodySmall" style={styles.progressLabel}>Progress</Text>
                        <Text variant="bodySmall" style={styles.progressValue}>{progressPercent}%</Text>
                    </View>
                    <ProgressBar progress={progressPercent / 100} />
                </View>

                {goal.why_text && (
                    <View style={styles.footer}>
                        <Text variant="caption" color={colors.textSecondary} italic numberOfLines={1}>
                            "{goal.why_text}"
                        </Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    titleContainer: {
        flex: 1,
        marginRight: spacing.sm,
    },
    title: {
        marginBottom: spacing.xs,
    },
    progressContainer: {
        marginBottom: spacing.sm,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    progressLabel: {
        color: colors.textSecondary,
    },
    progressValue: {
        fontWeight: '600',
        color: colors.primary,
    },
    footer: {
        marginTop: spacing.xs,
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    }
});
