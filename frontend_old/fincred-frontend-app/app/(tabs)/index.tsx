import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Text, Card, Button } from '@/components/ui';
import { GoalCard } from '@/components/cards/GoalCard';
import { StreakCounter } from '@/components/feedback/StreakCounter';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useSnapshot } from '@/hooks/useSnapshot';
import { useLatestCheckin } from '@/hooks/useCheckins';
import { useEducation } from '@/hooks/useEducation';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DashboardGoal } from '@/types/dashboard.types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { goals, stats, isLoading: isLoadingDashboard } = useDashboard();
  const { snapshot, isLoading: isLoadingSnapshot } = useSnapshot();
  const { data: latestCheckin } = useLatestCheckin();
  const { snippets: educationSnippets } = useEducation({ limit: 5 });

  const [showEducationModal, setShowEducationModal] = useState(false);

  const isLoading = isLoadingDashboard || isLoadingSnapshot;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const activeGoals = goals.slice(0, 3); // Dashboard already returns top 5 active

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header with Streak */}
        <View style={styles.header}>
          <View>
            <Text variant="h2">Hello, {user?.profile?.full_name?.split(' ')[0] || 'there'}!</Text>
            <Text variant="bodySmall" color={colors.textSecondary}>
              Let's see your progress today.
            </Text>
          </View>
          <StreakCounter count={stats?.current_streak || 0} />
        </View>

        {/* Stats Summary Card */}
        {stats && (
          <Card variant="elevated" style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="h2" color={colors.primary}>${(stats.total_saved || 0).toLocaleString()}</Text>
                <Text variant="caption" color={colors.textSecondary}>Total Saved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="h2" color={colors.success}>{stats.completed_goals}</Text>
                <Text variant="caption" color={colors.textSecondary}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text variant="h2" color={colors.primary}>{stats.active_goals}</Text>
                <Text variant="caption" color={colors.textSecondary}>Active</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Snapshot Status Card */}
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

        {/* Active Goals Section */}
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
          activeGoals.map((goal: DashboardGoal) => (
            <GoalCard
              key={goal.id}
              goal={{
                id: goal.id,
                name: goal.name,
                type: goal.type,
                target_amount: goal.target_amount,
                target_date: goal.target_date,
                priority: goal.priority,
                status: goal.status_label === 'completed' ? 'completed' : 'active',
                user_id: '',
                primary_flag: false,
                created_at: '',
                updated_at: '',
              }}
              progressPercent={goal.progress_percentage}
              onPress={() => router.push(`/goal/${goal.id}` as any)}
            />
          ))
        ) : (
          <Card variant="outline" style={styles.emptyGoalsCard}>
            <Text variant="body" align="center" color={colors.textSecondary}>No active goals found.</Text>
            <Button
              title="Create Your First Goal"
              variant="ghost"
              onPress={() => router.push('/goal/create' as any)}
            />
          </Card>
        )}

        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <Text variant="h3">Quick Actions</Text>
        </View>

        <View style={styles.quickActionsRow}>
          {/* Check-in Action */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/checkin/create' as any)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="checkmark-done" size={24} color={colors.primary} />
            </View>
            <Text variant="bodySmall" style={styles.quickActionLabel}>Check-in</Text>
            {latestCheckin && (
              <Text variant="caption" color={colors.textSecondary}>
                Last: {new Date(latestCheckin.completed_at).toLocaleDateString()}
              </Text>
            )}
          </TouchableOpacity>

          {/* Learn Action */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => setShowEducationModal(true)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="bulb" size={24} color={colors.warning} />
            </View>
            <Text variant="bodySmall" style={styles.quickActionLabel}>Learn</Text>
            <Text variant="caption" color={colors.textSecondary}>
              {educationSnippets.length} tips
            </Text>
          </TouchableOpacity>

          {/* Chat Action */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="chatbubbles" size={24} color={colors.success} />
            </View>
            <Text variant="bodySmall" style={styles.quickActionLabel}>Coach</Text>
            <Text variant="caption" color={colors.textSecondary}>AI Advice</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Check-ins */}
        {latestCheckin && (
          <>
            <View style={styles.sectionHeader}>
              <Text variant="h3">Recent Check-in</Text>
              <Button
                title="View All"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/checkin/list' as any)}
              />
            </View>
            <TouchableOpacity onPress={() => router.push(`/checkin/${latestCheckin.id}` as any)}>
              <Card variant="outline" padding="sm" style={styles.checkinCard}>
                <View style={styles.checkinContent}>
                  <View style={styles.moodIcon}>
                    <Text style={styles.moodEmoji}>
                      {getMoodEmoji(latestCheckin.mood_score)}
                    </Text>
                  </View>
                  <View style={styles.checkinText}>
                    <Text variant="body">
                      {getPaymentLabel(latestCheckin.made_planned_payments)} • {getSpendingLabel(latestCheckin.spending_vs_plan)}
                    </Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {new Date(latestCheckin.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
                </View>
              </Card>
            </TouchableOpacity>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="caption" align="center" color={colors.gray400}>
            {stats?.longest_streak ? `🔥 Longest streak: ${stats.longest_streak} weeks` : "The journey of a thousand miles begins with a single step."}
          </Text>
        </View>
      </ScrollView>

      {/* Education Modal */}
      <Modal
        visible={showEducationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEducationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text variant="h3">Financial Tips</Text>
            <Pressable onPress={() => setShowEducationModal(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            {educationSnippets.length > 0 ? (
              educationSnippets.map((snippet) => (
                <Card key={snippet.id} variant="outline" style={styles.educationCard}>
                  <View style={styles.educationHeader}>
                    <View style={styles.topicBadge}>
                      <Text variant="caption" color={colors.white}>
                        {formatTopic(snippet.topic)}
                      </Text>
                    </View>
                  </View>
                  <Text variant="h4" style={styles.educationTitle}>{snippet.short_title}</Text>
                  <Text variant="bodySmall" color={colors.textSecondary}>{snippet.content}</Text>
                </Card>
              ))
            ) : (
              <View style={styles.emptyEducation}>
                <Ionicons name="bulb-outline" size={48} color={colors.gray400} />
                <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
                  No tips available yet
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Helper functions
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

function formatTopic(topic: string): string {
  return topic.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
  statsCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray200,
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
    backgroundColor: colors.success + '08',
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
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  checkinCard: {
    marginBottom: spacing.md,
  },
  checkinContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  moodEmoji: {
    fontSize: 20,
  },
  checkinText: {
    flex: 1,
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  educationCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  educationHeader: {
    marginBottom: spacing.sm,
  },
  topicBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  educationTitle: {
    marginBottom: spacing.xs,
  },
  emptyEducation: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
});
