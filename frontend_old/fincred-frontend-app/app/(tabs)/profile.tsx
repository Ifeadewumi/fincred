import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView } from 'react-native';
import { Text, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={40} color={colors.primary} />
                    </View>
                    <Text variant="h2">{user?.profile?.full_name || 'FinCred User'}</Text>
                    <Text variant="body" color={colors.textSecondary}>{user?.email}</Text>
                </View>

                <Card style={styles.card}>
                    <Text variant="h4" style={styles.cardTitle}>Account Settings</Text>

                    <View style={styles.infoRow}>
                        <Text variant="label" color={colors.textSecondary}>Full Name</Text>
                        <Text variant="body">{user?.profile?.full_name || 'Not set'}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text variant="label" color={colors.textSecondary}>Email</Text>
                        <Text variant="body">{user?.email}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text variant="label" color={colors.textSecondary}>Verification Status</Text>
                        <Text variant="body" color={user?.is_verified ? colors.success : colors.warning}>
                            {user?.is_verified ? 'Verified' : 'Unverified'}
                        </Text>
                    </View>
                </Card>

                <Button
                    title="Sign Out"
                    variant="danger"
                    onPress={logout}
                    style={styles.logoutButton}
                />

                <View style={styles.footer}>
                    <Text variant="caption" align="center" color={colors.gray400}>
                        Version 1.0.0
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
    },
    header: {
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xxl,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    card: {
        marginBottom: spacing.xl,
    },
    cardTitle: {
        marginBottom: spacing.lg,
    },
    infoRow: {
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray50,
    },
    logoutButton: {
        marginTop: spacing.md,
    },
    footer: {
        marginTop: spacing.xxl,
        paddingBottom: spacing.xl,
    }
});
