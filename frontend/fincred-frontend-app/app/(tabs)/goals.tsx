import React from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView, ActivityIndicator, FlatList } from 'react-native';
import { Text, Button, Card } from '@/components/ui';
import { GoalCard } from '@/components/cards/GoalCard';
import { colors, spacing } from '@/theme';
import { useGoals } from '@/hooks/useGoals';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function GoalsScreen() {
    const { goals, isLoading, error } = useGoals();
    const router = useRouter();

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text variant="h2">My Plan</Text>
                    <Button
                        title="Add Goal"
                        variant="primary"
                        size="sm"
                        onPress={() => {/* TODO: Open Create Goal Wizard */ }}
                    />
                </View>

                {goals.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIcon}>
                            <Ionicons name="flag-outline" size={48} color={colors.gray300} />
                        </View>
                        <Text variant="h3" align="center">No goals yet</Text>
                        <Text variant="body" color={colors.textSecondary} align="center" style={styles.emptyText}>
                            Your AI coach can help you define your first financial goal.
                        </Text>
                        <Button
                            title="Start Onboarding"
                            variant="outline"
                            style={styles.emptyButton}
                            onPress={() => router.push('/chat')}
                        />
                    </View>
                ) : (
                    <FlatList
                        data={goals}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <GoalCard
                                goal={item}
                                progressPercent={0} // TODO: Fetch real progress
                                onPress={() => router.push(`/goal/${item.id}`)}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingTop: spacing.sm,
    },
    listContent: {
        paddingBottom: spacing.xxl,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.gray50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    emptyText: {
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    emptyButton: {
        width: '100%',
    },
});
