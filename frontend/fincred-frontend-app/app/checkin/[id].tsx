import React from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCheckin, useCheckins } from '@/hooks/useCheckins';

export default function CheckinDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: checkin, isLoading, error } = useCheckin(id || '');
    const { deleteCheckin, isDeleting } = useCheckins();

    const handleDelete = () => {
        Alert.alert(
            'Delete Check-in',
            'Are you sure you want to delete this check-in?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCheckin(id!);
                            router.back();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete check-in');
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

    if (error || !checkin) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text variant="h3">Check-in</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
                        Check-in not found
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text variant="h3">Check-in Details</Text>
                    <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={24} color={colors.danger} />
                    </TouchableOpacity>
                </View>

                {/* Date */}
                <Text variant="bodySmall" color={colors.textSecondary} style={styles.date}>
                    {new Date(checkin.completed_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Text>

                {/* Mood */}
                <Card variant="elevated" style={styles.moodCard}>
                    <View style={styles.moodDisplay}>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(checkin.mood_score)}</Text>
                        <Text variant="h4">{getMoodLabel(checkin.mood_score)}</Text>
                    </View>
                </Card>

                {/* Details */}
                <Card variant="outline" style={styles.detailCard}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="card" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text variant="caption" color={colors.textSecondary}>Planned Payments</Text>
                            <Text variant="body">{getPaymentLabel(checkin.made_planned_payments)}</Text>
                        </View>
                        {getPaymentIcon(checkin.made_planned_payments)}
                    </View>
                </Card>

                <Card variant="outline" style={styles.detailCard}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailIcon}>
                            <Ionicons name="wallet" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.detailContent}>
                            <Text variant="caption" color={colors.textSecondary}>Spending vs Plan</Text>
                            <Text variant="body">{getSpendingLabel(checkin.spending_vs_plan)}</Text>
                        </View>
                        {getSpendingIcon(checkin.spending_vs_plan)}
                    </View>
                </Card>

                {checkin.comment && (
                    <Card variant="outline" style={styles.detailCard}>
                        <Text variant="caption" color={colors.textSecondary}>Notes</Text>
                        <Text variant="body" style={{ marginTop: spacing.xs }}>{checkin.comment}</Text>
                    </Card>
                )}

                {/* Delete Button */}
                <Button
                    title={isDeleting ? 'Deleting...' : 'Delete Check-in'}
                    variant="outline"
                    onPress={handleDelete}
                    disabled={isDeleting}
                    style={styles.deleteButtonLarge}
                />
            </ScrollView>
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
        case 'yes': return 'All payments made';
        case 'no': return 'Payments not made';
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

function getPaymentIcon(status: string) {
    switch (status) {
        case 'yes':
            return <Ionicons name="checkmark-circle" size={24} color={colors.success} />;
        case 'no':
            return <Ionicons name="close-circle" size={24} color={colors.danger} />;
        default:
            return <Ionicons name="remove-circle" size={24} color={colors.warning} />;
    }
}

function getSpendingIcon(status: string) {
    switch (status) {
        case 'under':
            return <Ionicons name="trending-down" size={24} color={colors.success} />;
        case 'over':
            return <Ionicons name="trending-up" size={24} color={colors.danger} />;
        default:
            return <Ionicons name="remove" size={24} color={colors.primary} />;
    }
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
        marginBottom: spacing.sm,
    },
    backButton: {
        padding: spacing.xs,
    },
    deleteButton: {
        padding: spacing.xs,
    },
    date: {
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    moodCard: {
        marginBottom: spacing.lg,
        padding: spacing.lg,
        alignItems: 'center',
    },
    moodDisplay: {
        alignItems: 'center',
    },
    moodEmoji: {
        fontSize: 64,
        marginBottom: spacing.sm,
    },
    detailCard: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    detailContent: {
        flex: 1,
    },
    deleteButtonLarge: {
        marginTop: spacing.lg,
        marginBottom: spacing.xxl,
        borderColor: colors.danger,
    },
});
