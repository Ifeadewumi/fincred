import React from 'react';
import { StyleSheet, View, TouchableOpacity, Switch } from 'react-native';
import { Card, Text } from '../ui';
import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { NudgeSchedule, NotificationType, NotificationChannel } from '@/types/notification.types';

interface Props {
    notification: NudgeSchedule;
    onToggle?: (notification: NudgeSchedule) => void;
    onDelete?: (id: string) => void;
}

export const NotificationCard: React.FC<Props> = ({ notification, onToggle, onDelete }) => {
    const isActive = notification.status === 'active';

    return (
        <Card variant="elevated" style={styles.container}>
            <View style={styles.header}>
                <View style={styles.info}>
                    <View style={[styles.typeIcon, { backgroundColor: getTypeColor(notification.type) + '15' }]}>
                        <Ionicons
                            name={getTypeIcon(notification.type)}
                            size={20}
                            color={getTypeColor(notification.type)}
                        />
                    </View>
                    <View style={styles.text}>
                        <Text variant="body">{getTypeLabel(notification.type)}</Text>
                        <Text variant="caption" color={colors.textSecondary}>
                            via {getChannelLabel(notification.channel)}
                        </Text>
                    </View>
                </View>
                {onToggle && (
                    <Switch
                        value={isActive}
                        onValueChange={() => onToggle(notification)}
                        trackColor={{ false: colors.gray300, true: colors.primary + '50' }}
                        thumbColor={isActive ? colors.primary : colors.gray400}
                    />
                )}
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text variant="caption" color={colors.textSecondary} style={styles.detailText}>
                        Next: {formatDate(notification.next_send_at)}
                    </Text>
                </View>
                {notification.last_sent_at && (
                    <View style={styles.detailRow}>
                        <Ionicons name="checkmark-outline" size={14} color={colors.textSecondary} />
                        <Text variant="caption" color={colors.textSecondary} style={styles.detailText}>
                            Last: {formatDate(notification.last_sent_at)}
                        </Text>
                    </View>
                )}
            </View>

            {onDelete && (
                <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(notification.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text variant="caption" color={colors.danger} style={{ marginLeft: 4 }}>
                        Remove
                    </Text>
                </TouchableOpacity>
            )}
        </Card>
    );
};

function getTypeIcon(type: NotificationType): any {
    switch (type) {
        case 'checkin_reminder': return 'checkbox-outline';
        case 'goal_progress_update': return 'trending-up';
        case 'pre_transfer_reminder': return 'card-outline';
        case 'weekly_summary': return 'calendar-outline';
        default: return 'notifications-outline';
    }
}

function getTypeLabel(type: NotificationType): string {
    switch (type) {
        case 'checkin_reminder': return 'Check-in Reminder';
        case 'goal_progress_update': return 'Goal Progress Update';
        case 'pre_transfer_reminder': return 'Transfer Reminder';
        case 'weekly_summary': return 'Weekly Summary';
        default: return type;
    }
}

function getTypeColor(type: NotificationType): string {
    switch (type) {
        case 'checkin_reminder': return colors.primary;
        case 'goal_progress_update': return colors.success;
        case 'pre_transfer_reminder': return colors.warning;
        case 'weekly_summary': return colors.primary;
        default: return colors.gray500;
    }
}

function getChannelLabel(channel: NotificationChannel): string {
    switch (channel) {
        case 'push': return 'Push Notification';
        case 'email': return 'Email';
        default: return channel;
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    typeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        marginLeft: spacing.md,
        flex: 1,
    },
    details: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    detailText: {
        marginLeft: spacing.xs,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
});
