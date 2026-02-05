import React from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView } from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { GoalCard } from '@/components/cards/GoalCard';
import { StreakCounter } from '@/components/feedback/StreakCounter';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// Mock data for initial layout
const MOCK_GOAL = {
  id: '1',
  user_id: 'user1',
  goal_type: 'SAVINGS' as const,
  name: 'Emergency Fund',
  target_amount: 5000,
  target_date: new Date(2026, 11, 31).toISOString(),
  priority: 'HIGH' as const,
  status: 'ACTIVE' as const,
  why_text: 'For peace of mind and unexpected expenses.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text variant="h2">Hello, {user?.full_name.split(' ')[0] || 'there'}!</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Let's see your progress today.
            </Text>
          </View>
          <StreakCounter count={1} />
        </View>

        <Card variant="elevated" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text variant="h4" style={styles.statusTitle}>You're on track!</Text>
          </View>
          <Text variant="bodySmall" color={colors.textSecondary}>
            You've completed all your planned actions for this week.
          </Text>
          <Button
            title="View Weekly Report"
            variant="outline"
            size="sm"
            style={styles.statusButton}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text variant="h3">Active Goals</Text>
          <Button title="See All" variant="ghost" size="sm" />
        </View>

        <GoalCard goal={MOCK_GOAL} progressPercent={35} />

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.successLight + '05', // Very faint green
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
