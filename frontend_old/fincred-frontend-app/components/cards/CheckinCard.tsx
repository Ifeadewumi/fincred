import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text } from '../ui';
import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { CheckIn } from '@/types/checkin.types';

interface Props {
    checkin: CheckIn;
    onPress?: () => void;
    compact?: boolean;
}

export const CheckinCard: React.FC<Props> = ({ checkin, onPress, compact = false }) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
            <Card variant="outline" style={[styles.container, compact && styles.containerCompact]}>
                <View style={styles.content}>
                    <View style={styles.moodIcon}>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(checkin.mood_score)}</Text>
                    </View>
                    <View style={styles.info}>
                        <Text variant="body">{getMoodLabel(checkin.mood_score)}</Text>
                        <Text variant="caption" color={colors.textSecondary}>
                            {getPaymentLabel(checkin.made_planned_payments)} • {getSpendingLabel(checkin.spending_vs_plan)}
                        </Text>
                    </View>
                    <View style={styles.meta}>
                        <Text variant="caption" color={colors.textSecondary}>
                            {formatDate(checkin.completed_at)}
                        </Text>
                        {onPress && <Ionicons name="chevron-forward" size={16} color={colors.gray400} />}
                    </View>
                </View>
                {!compact && checkin.comment && (
                    <View style={styles.commentSection}>
                        <Text variant="caption" color={colors.textSecondary} numberOfLines={2}>
                            {checkin.comment}
                        </Text>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
};

function getMoodEmoji(score: number): string {
    switch (score) {
        case 1: return '😢';
        case 2: return '😕';
        case 3: return '😐';
        case 4: return '🙂';
        case 5: return '😄';
        default: return '😐';
    }
}

function getMoodLabel(score: number): string {
    switch (score) {
        case 1: return 'Very Bad';
        case 2: return 'Bad';
        case 3: return 'Okay';
        case 4: return 'Good';
        case 5: return 'Great';
        default: return 'Unknown';
    }
}

function getPaymentLabel(status: string): string {
    switch (status) {
        case 'yes': return 'Payments made';
        case 'no': return 'Payments missed';
        case 'partial': return 'Partial payments';
        default: return status;
    }
}

function getSpendingLabel(status: string): string {
    switch (status) {
        case 'under': return 'Under budget';
        case 'on': return 'On budget';
        case 'over': return 'Over budget';
        default: return status;
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
    containerCompact: {
        padding: spacing.sm,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    moodIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moodEmoji: {
        fontSize: 24,
    },
    info: {
        flex: 1,
        marginLeft: spacing.md,
    },
    meta: {
        alignItems: 'flex-end',
    },
    commentSection: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
    },
});
