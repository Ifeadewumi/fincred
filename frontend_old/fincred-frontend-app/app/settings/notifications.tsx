import React, { useState } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Switch,
    Alert,
} from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useNotifications';
import type { NudgeSchedule, NotificationType, NotificationChannel, NotificationStatus } from '@/types/notification.types';

export default function NotificationSettingsScreen() {
    const router = useRouter();
    const {
        notifications,
        isLoading,
        updateNotification,
        deleteNotification,
        isUpdating,
        isDeleting,
    } = useNotifications();

    const handleToggleStatus = async (notification: NudgeSchedule) => {
        try {
            const newStatus: NotificationStatus = notification.status === 'active' ? 'paused' : 'active';
            await updateNotification({
                id: notification.id,
                data: { status: newStatus },
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to update notification');
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Notification',
            'Are you sure you want to delete this notification?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteNotification(id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete notification');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text variant="h3">Notification Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Info Card */}
                <Card variant="outline" style={styles.infoCard}>
                    <View style={styles.infoContent}>
                        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                        <Text variant="bodySmall" color={colors.textSecondary} style={styles.infoText}>
                            Manage your nudge reminders and notification preferences
                        </Text>
                    </View>
                </Card>

                {/* Notification List */}
                {notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <Card key={notification.id} variant="elevated" style={styles.notificationCard}>
                            <View style={styles.notificationHeader}>
                                <View style={styles.notificationInfo}>
                                    <View style={[styles.typeIcon, { backgroundColor: getTypeColor(notification.type) + '15' }]}>
                                        <Ionicons
                                            name={getTypeIcon(notification.type)}
                                            size={20}
                                            color={getTypeColor(notification.type)}
                                        />
                                    </View>
                                    <View style={styles.notificationText}>
                                        <Text variant="body">{getTypeLabel(notification.type)}</Text>
                                        <Text variant="caption" color={colors.textSecondary}>
                                            via {getChannelLabel(notification.channel)}
                                        </Text>
                                    </View>
                                </View>
                                <Switch
                                    value={notification.status === 'active'}
                                    onValueChange={() => handleToggleStatus(notification)}
                                    trackColor={{ false: colors.gray300, true: colors.primary + '50' }}
                                    thumbColor={notification.status === 'active' ? colors.primary : colors.gray400}
                                />
                            </View>

                            <View style={styles.notificationDetails}>
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                                    <Text variant="caption" color={colors.textSecondary} style={styles.detailText}>
                                        Next: {formatDate(notification.next_send_at)}
                                    </Text>
                                </View>
                                {notification.last_sent_at && (
                                    <View style={styles.detailRow}>
                                        <Ionicons name="checkmark-outline" size={16} color={colors.textSecondary} />
                                        <Text variant="caption" color={colors.textSecondary} style={styles.detailText}>
                                            Last sent: {formatDate(notification.last_sent_at)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(notification.id)}
                            >
                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                <Text variant="caption" color={colors.danger} style={{ marginLeft: 4 }}>
                                    Remove
                                </Text>
                            </TouchableOpacity>
                        </Card>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.gray300} />
                        <Text variant="h4" color={colors.textSecondary} style={styles.emptyTitle}>
                            No notifications set up
                        </Text>
                        <Text variant="bodySmall" color={colors.textSecondary} style={styles.emptyText}>
                            Notifications help you stay on track with your goals
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray200,
    },
    backButton: {
        padding: spacing.xs,
    },
    infoCard: {
        marginBottom: spacing.lg,
        padding: spacing.md,
    },
    infoContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        marginLeft: spacing.md,
    },
    notificationCard: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notificationInfo: {
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
    notificationText: {
        marginLeft: spacing.md,
        flex: 1,
    },
    notificationDetails: {
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
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
    },
    emptyTitle: {
        marginTop: spacing.md,
    },
    emptyText: {
        marginTop: spacing.xs,
        textAlign: 'center',
    },
});
