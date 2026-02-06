import React from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView, ActivityIndicator } from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { GoalCard } from '@/components/cards/GoalCard';
import { StreakCounter } from '@/components/feedback/StreakCounter';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals } from '@/hooks/useGoals';
import { useSnapshot } from '@/hooks/useSnapshot';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Goal } from '@/types/goal.types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, isLoading: isLoadingGoals } = useGoals();
  const { snapshot, isLoading: isLoadingSnapshot } = useSnapshot();

  const isLoading = isLoadingGoals || isLoadingSnapshot;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const activeGoals = goals.filter((g: Goal) => g.status === 'active').slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text variant="h2">Hello, {user?.profile?.full_name?.split(' ')[0] || 'there'}!</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Let's see your progress today.
            </Text>
          </View>
          <StreakCounter count={1} />
        </View>

        {!snapshot ? (
          <Card variant="elevated" style={styles.onboardingCard}>
            <View style={styles.onboardingHeader}>
              <View style={styles.onboardingIcon}>
                <Ionicons name="sparkles" size={24} color={colors.white} />
              </View>
              <Text variant="h4" style={styles.onboardingTitle}>Complete Your Profile</Text>
            </View>
            <Text variant="bodySmall" color={colors.textSecondary} style={styles.onboardingText}>
              Set up your financial snapshot to get personalized coaching and accurate goal timelines.
            </Text>
            <Button
              title="Start Snapshot"
              onPress={() => router.push('/snapshot')}
              style={styles.onboardingButton}
            />
          </Card>
        ) : (
          <Card variant="elevated" style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text variant="h4" style={styles.statusTitle}>You're on track!</Text>
            </View>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Your monthly surplus is ${((snapshot.income?.amount || 0) - (snapshot.expenses?.total_amount || 0)).toLocaleString()}.
            </Text>
            <Button
              title="Update Snapshot"
              variant="outline"
              size="sm"
              onPress={() => router.push('/snapshot')}
              style={styles.statusButton}
            />
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text variant="h3">Active Goals</Text>
          <Button
            title="See All"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)/goals')}
          />
        </View>

        {activeGoals.length > 0 ? (
          activeGoals.map((goal: Goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progressPercent={0}
              onPress={() => router.push(`/goal/${goal.id}`)}
            />
          ))
        ) : (
          <Card variant="outline" style={styles.emptyGoalsCard}>
            <Text variant="body" align="center" color={colors.textSecondary}>No active goals found.</Text>
            <Button
              title="Create Your First Goal"
              variant="ghost"
              onPress={() => router.push('/goal/create')}
            />
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text variant="h3">Upcoming Actions</Text>
        </View>

        <Card variant="outline" padding="sm" style={styles.actionCard}>
          <View style={styles.actionContent}>
            <View style={styles.actionIcon}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionText}>
              <Text variant="body">Weekly Check-in</Text>
              <Text variant="caption" color={colors.textSecondary}>Sunday, Feb 8</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </View>
        </Card>

        <View style={styles.footer}>
          <Text variant="caption" align="center" color={colors.gray400}>
            "The journey of a thousand miles begins with a single step."
          </Text>
        </View>
      </ScrollView>
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
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.lg,
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
  },
  onboardingCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
    padding: spacing.lg,
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  onboardingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  onboardingTitle: {
    color: colors.text,
  },
  onboardingText: {
    marginBottom: spacing.lg,
  },
  onboardingButton: {
    width: '100%',
  },
  statusCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.success + '05', // Very faint green
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusTitle: {
    marginLeft: spacing.xs,
    color: colors.success,
  },
  statusButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  emptyGoalsCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  actionCard: {
    marginBottom: spacing.md,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionText: {
    flex: 1,
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  }
});
