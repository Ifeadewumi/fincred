import { Stack } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingLayout() {
    const router = useRouter();
    const segments = useSegments();

    // Calculate progress based on current route
    const currentRoute = segments[segments.length - 1];

    let progress = 0.25;
    if (currentRoute === 'persona') progress = 0.25;
    if (currentRoute === 'snapshot') progress = 0.5; // This might be handled in snapshot's own layout or index
    if (currentRoute === 'discover') progress = 0.75;
    if (currentRoute === 'review') progress = 0.9;
    if (currentRoute === 'commitment') progress = 1.0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={{ width: 40 }} /> {/* Spacer for balance */}
            </View>
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: 60, // Adjust for status bar
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray100,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: colors.gray200,
        borderRadius: 4,
        marginHorizontal: spacing.md,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
});
