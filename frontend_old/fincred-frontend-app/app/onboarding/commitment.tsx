import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, Button, Input, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { goalsApi } from '@/services/api/goals';

export default function CommitmentScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const goalId = params.goalId as string;

    const [whyText, setWhyText] = useState('');
    const [isCommitted, setIsCommitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCommit = async () => {
        if (!whyText.trim()) {
            Alert.alert('Motivation Required', 'Please tell us why this goal matters to you.');
            return;
        }
        if (!isCommitted) {
            Alert.alert('Commitment Required', 'Please check the box to commit to your goal.');
            return;
        }

        try {
            setIsSubmitting(true);
            await goalsApi.update(goalId, {
                why_text: whyText
            });

            // Navigate to Action Setup
            router.push({
                pathname: '/goal/setup-action',
                params: { goalId }
            });
        } catch (error) {
            console.error('Failed to update goal:', error);
            Alert.alert('Error', 'Failed to save commitment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text variant="h2" align="center">One last thing...</Text>
                    <Text variant="body" align="center" color={colors.textSecondary}>
                        Goals tied to a strong "Why" are 2x more likely to succeed.
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text variant="h4" style={styles.question}>
                        Why does achieving this matter to you?
                    </Text>
                    <Input
                        placeholder="I want to be debt-free so I can..."
                        value={whyText}
                        onChangeText={setWhyText}
                        multiline
                        numberOfLines={4}
                        style={styles.textArea}
                        textAlignVertical="top"
                    />

                    <View style={styles.pactContainer}>
                        <TouchableOpacity
                            style={styles.checkboxRow}
                            onPress={() => setIsCommitted(!isCommitted)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, isCommitted && styles.checkboxChecked]}>
                                {isCommitted && <Ionicons name="checkmark" size={16} color={colors.white} />}
                            </View>
                            <Text variant="body" style={styles.pactText}>
                                I commit to tracking this goal for at least 30 days.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Button
                    title="Let's Do This!"
                    onPress={handleCommit}
                    loading={isSubmitting}
                    size="lg"
                    style={styles.button}
                    disabled={!whyText || !isCommitted}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
        flexGrow: 1,
    },
    header: {
        marginBottom: spacing.xl,
        marginTop: spacing.xl,
    },
    form: {
        marginBottom: spacing.xxl,
    },
    question: {
        marginBottom: spacing.md,
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    pactContainer: {
        marginTop: spacing.xl,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primary,
        marginRight: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
    },
    pactText: {
        flex: 1,
        fontWeight: '500',
    },
    button: {
        marginTop: 'auto',
        marginBottom: spacing.xl,
    },
});
