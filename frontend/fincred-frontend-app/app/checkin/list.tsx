import React from 'react';
import { StyleSheet, FlatList, View, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCheckins } from '@/hooks/useCheckins';
import type { CheckIn } from '@/types/checkin.types';

export default function CheckinListScreen() {
    const router = useRouter();
    const { checkins, isLoading, refetch } = useCheckins();

    const renderCheckin = ({ item }: { item: CheckIn }) => (
        <TouchableOpacity onPress={() => router.push(`/checkin/${item.id}` as any)}>
            <Card variant="outline" padding="sm" style={styles.checkinCard}>
                <View style={styles.checkinContent}>
                    <View style={styles.moodIcon}>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood_score)}</Text>
                    </View>
                    <View style={styles.checkinText}>
                        <Text variant="body">
                            {getPaymentLabel(item.made_planned_payments)} • {getSpendingLabel(item.spending_vs_plan)}
                        </Text>
                        <Text variant="caption" color={colors.textSecondary}>
                            {formatDate(item.completed_at)}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                </View>
            </Card>
        </TouchableOpacity>
    );

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
                <Text variant="h3">Check-ins</Text>
                <TouchableOpacity onPress={() => router.push('/checkin/create' as any)} style={styles.addButton}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {checkins.length > 0 ? (
                <FlatList
                    data={checkins}
                    renderItem={renderCheckin}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isLoading}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="checkbox-outline" size={64} color={colors.gray300} />
                    <Text variant="h4" color={colors.textSecondary} style={styles.emptyTitle}>
                        No check-ins yet
                    </Text>
                    <Text variant="bodySmall" color={colors.textSecondary} style={styles.emptyText}>
                        Start tracking your weekly progress
                    </Text>
                    <Button
                        title="Create First Check-in"
                        onPress={() => router.push('/checkin/create' as any)}
                        style={styles.emptyButton}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

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

function getPaymentLabel(status: string): string {
    switch (status) {
        case 'yes': return 'Payments ✓';
        case 'no': return 'Payments ✗';
        case 'partial': return 'Partial';
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
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
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
    addButton: {
        padding: spacing.xs,
    },
    listContent: {
        padding: spacing.md,
    },
    checkinCard: {
        marginBottom: spacing.sm,
    },
    checkinContent: {
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
        marginRight: spacing.md,
    },
    moodEmoji: {
        fontSize: 24,
    },
    checkinText: {
        flex: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyTitle: {
        marginTop: spacing.md,
    },
    emptyText: {
        marginTop: spacing.xs,
        textAlign: 'center',
    },
    emptyButton: {
        marginTop: spacing.lg,
    },
});
