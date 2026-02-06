import React from 'react';
import { StyleSheet, FlatList, View, SafeAreaView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCheckins } from '@/hooks/useCheckins';
import type { CheckIn } from '@/types/checkin.types';
import { Svg, Path, Circle, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');
const GRAPH_HEIGHT = 180;
const GRAPH_WIDTH = width - 48; // Padding

export default function CheckinListScreen() {
    const router = useRouter();
    const { checkins, isLoading, refetch } = useCheckins();

    const sortedCheckins = [...(checkins || [])].sort((a, b) =>
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    ).slice(-7); // Last 7 check-ins

    const renderCheckin = ({ item }: { item: CheckIn }) => (
        <TouchableOpacity onPress={() => router.push(`/checkin/${item.id}` as any)}>
            <Card variant="outline" style={styles.checkinCard}>
                <View style={styles.checkinContent}>
                    <View style={styles.moodIcon}>
                        <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood_score)}</Text>
                    </View>
                    <View style={styles.checkinText}>
                        <Text variant="body" style={styles.checkinTitle}>
                            {formatDate(item.completed_at)}
                        </Text>
                        <Text variant="caption" color={colors.textSecondary}>
                            {getPaymentLabel(item.made_planned_payments)} • {getSpendingLabel(item.spending_vs_plan)}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                </View>
            </Card>
        </TouchableOpacity>
    );

    const renderGraph = () => {
        if (sortedCheckins.length < 2) return null;

        const data = sortedCheckins.map((c, i) => ({
            x: (i / (sortedCheckins.length - 1)) * GRAPH_WIDTH,
            y: GRAPH_HEIGHT - ((c.mood_score - 1) / 4) * (GRAPH_HEIGHT - 40) - 20, // 1-5 scale mapped to height
            score: c.mood_score,
            date: new Date(c.completed_at)
        }));

        let pathD = `M ${data[0].x} ${data[0].y}`;
        data.forEach((p, i) => {
            if (i === 0) return;
            // Simple bezier curve would be better but line is fine for MVP
            pathD += ` L ${p.x} ${p.y}`;
        });

        return (
            <Card style={styles.graphCard}>
                <Text variant="h4" style={styles.graphTitle}>Mood Trend</Text>
                <View style={styles.graphContainer}>
                    <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
                        {/* Grid Lines */}
                        {[1, 2, 3, 4, 5].map((score) => {
                            const y = GRAPH_HEIGHT - ((score - 1) / 4) * (GRAPH_HEIGHT - 40) - 20;
                            return (
                                <Line
                                    key={score}
                                    x1="0"
                                    y1={y}
                                    x2={GRAPH_WIDTH}
                                    y2={y}
                                    stroke={colors.gray200}
                                    strokeDasharray="4"
                                    strokeWidth="1"
                                />
                            );
                        })}

                        {/* Line Path */}
                        <Path
                            d={pathD}
                            stroke={colors.primary}
                            strokeWidth="3"
                            fill="none"
                        />

                        {/* Data Points */}
                        {data.map((p, i) => (
                            <React.Fragment key={i}>
                                <Circle
                                    cx={p.x}
                                    cy={p.y}
                                    r="5"
                                    fill={colors.white}
                                    stroke={colors.primary}
                                    strokeWidth="2"
                                />
                                <SvgText
                                    x={p.x}
                                    y={GRAPH_HEIGHT - 5}
                                    fontSize="10"
                                    fill={colors.textSecondary}
                                    textAnchor="middle"
                                >
                                    {p.date.getDate()}/{p.date.getMonth() + 1}
                                </SvgText>
                            </React.Fragment>
                        ))}
                    </Svg>
                </View>
            </Card>
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text variant="h3">Check-ins</Text>
                <TouchableOpacity onPress={() => router.push('/checkin/create' as any)} style={styles.addButton}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={checkins}
                renderItem={renderCheckin}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={renderGraph}
                onRefresh={refetch}
                refreshing={isLoading}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="checkbox-outline" size={64} color={colors.gray300} />
                        <Text variant="h4" color={colors.textSecondary} style={styles.emptyTitle}>
                            No check-ins yet
                        </Text>
                        <Text variant="caption" color={colors.textSecondary} style={styles.emptyText}>
                            Start tracking your weekly progress to see insights here.
                        </Text>
                        <Button
                            title="Create First Check-in"
                            onPress={() => router.push('/checkin/create' as any)}
                            style={styles.emptyButton}
                        />
                    </View>
                }
            />
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
        backgroundColor: colors.white,
    },
    backButton: {
        padding: spacing.xs,
    },
    addButton: {
        padding: spacing.xs,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    graphCard: {
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.white,
    },
    graphTitle: {
        marginBottom: spacing.md,
    },
    graphContainer: {
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    checkinCard: {
        marginBottom: spacing.sm,
        padding: spacing.md,
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
    checkinTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xl,
    },
    emptyTitle: {
        marginTop: spacing.md,
    },
    emptyText: {
        marginTop: spacing.xs,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    emptyButton: {
        minWidth: 200,
    },
});
