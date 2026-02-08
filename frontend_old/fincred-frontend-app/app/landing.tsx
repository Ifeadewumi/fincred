import React, { useEffect, useState } from 'react';
import { StyleSheet, View, SafeAreaView, Dimensions, Image } from 'react-native';
import { Text, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const quotes = [
    "The journey of a thousand miles begins with a single step.",
    "Do not save what is left after spending, but spend what is left after saving.",
    "A budget is telling your money where to go instead of wondering where it went.",
    "Financial freedom is available to those who learn about it and work for it.",
    "It's not how much money you make, but how much money you keep."
];

export default function LandingScreen() {
    const router = useRouter();
    const [quote, setQuote] = useState('');

    useEffect(() => {
        // Pick a random quote on mount
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.content}>
                    {/* Logo & Branding */}
                    <View style={styles.brandContainer}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="trending-up" size={48} color={colors.primary} />
                        </View>
                        <Text variant="h1" align="center" style={styles.appName}>FinCred</Text>
                        <Text variant="h3" align="center" color={colors.textSecondary} style={styles.tagline}>
                            Turn financial goals into done.
                        </Text>
                    </View>

                    {/* Value Props */}
                    <View style={styles.featuresContainer}>
                        <FeatureItem
                            icon="chatbubbles-outline"
                            text="Chat with your AI financial coach"
                        />
                        <FeatureItem
                            icon="list-outline"
                            text="Create actionable plans for your goals"
                        />
                        <FeatureItem
                            icon="stats-chart-outline"
                            text="Track your progress with weekly check-ins"
                        />
                    </View>
                </View>

                {/* Bottom Section */}
                <View style={styles.footer}>
                    {/* Motivational Quote */}
                    <View style={styles.quoteContainer}>
                        <Text variant="caption" align="center" italic color={colors.textSecondary}>
                            "{quote}"
                        </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Button
                            title="Get Started"
                            size="lg"
                            onPress={() => router.push('/(auth)/signup')}
                            style={styles.mainButton}
                        />
                        <Button
                            title="I have an account"
                            variant="ghost"
                            onPress={() => router.push('/(auth)/login')}
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

function FeatureItem({ icon, text }: { icon: any, text: string }) {
    return (
        <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
                <Ionicons name={icon} size={24} color={colors.primary} />
            </View>
            <Text variant="body" style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    brandContainer: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    appName: {
        marginBottom: spacing.xs,
        fontSize: 36,
    },
    tagline: {
        fontWeight: 'normal',
        maxWidth: 280,
    },
    featuresContainer: {
        marginTop: spacing.xl,
        marginHorizontal: spacing.md,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    featureText: {
        flex: 1,
    },
    footer: {
        marginTop: spacing.xl,
    },
    quoteContainer: {
        marginBottom: spacing.xl,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.surface,
    },
    actions: {
        gap: spacing.sm,
    },
    mainButton: {
        width: '100%',
    },
});
