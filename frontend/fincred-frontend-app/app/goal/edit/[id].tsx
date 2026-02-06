import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Text, Input, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useGoal, useGoals } from '@/hooks/useGoals';
import { GoalStatus, GoalPriority } from '@/types/goal.types';

export default function EditGoalScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { data: goal, isLoading: isLoadingGoal } = useGoal(id as string);
    const { updateGoal, isUpdating } = useGoals();

    const [formData, setFormData] = useState({
        name: '',
        target_amount: 0,
        target_date: '',
        why_text: '',
        status: 'active' as GoalStatus,
        priority: 'Medium' as GoalPriority,
    });

    useEffect(() => {
        if (goal) {
            setFormData({
                name: goal.name,
                target_amount: goal.target_amount,
                target_date: goal.target_date,
                why_text: goal.why_text || '',
                status: goal.status,
                priority: goal.priority,
            });
        }
    }, [goal]);

    const handleSave = async () => {
        if (!formData.name || !formData.target_amount || !formData.target_date) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            await updateGoal({
                id: id as string,
                data: formData,
            });
            if (typeof window !== 'undefined' && (window as any).alert) {
                window.alert('Goal updated successfully');
            } else {
                Alert.alert('Success', 'Goal updated successfully');
            }
            router.back();
        } catch (error) {
            console.error('Failed to update goal:', error);
            if (typeof window !== 'undefined' && (window as any).alert) {
                window.alert('Failed to update goal');
            } else {
                Alert.alert('Error', 'Failed to update goal');
            }
        }
    };

    if (isLoadingGoal) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!goal) {
        return (
            <View style={styles.centered}>
                <Text variant="h3">Goal not found</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Edit Goal', headerShown: true }} />
            <ScrollView contentContainerStyle={styles.content}>
                <Input
                    label="Goal Name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="e.g. Emergency Fund"
                />
                <Input
                    label="Target Amount"
                    value={formData.target_amount.toString()}
                    onChangeText={(text) => setFormData({ ...formData, target_amount: parseFloat(text) || 0 })}
                    placeholder="0.00"
                    keyboardType="numeric"
                />
                <Input
                    label="Target Date"
                    value={formData.target_date}
                    onChangeText={(text) => setFormData({ ...formData, target_date: text })}
                    placeholder="YYYY-MM-DD"
                />
                <Input
                    label="Why does this matter?"
                    value={formData.why_text}
                    onChangeText={(text) => setFormData({ ...formData, why_text: text })}
                    placeholder="Your motivation..."
                    multiline
                    numberOfLines={3}
                />

                <View style={styles.footer}>
                    <Button
                        title="Cancel"
                        variant="outline"
                        onPress={() => router.back()}
                        style={styles.button}
                    />
                    <Button
                        title="Save Changes"
                        onPress={handleSave}
                        loading={isUpdating}
                        style={styles.button}
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.md,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    button: {
        flex: 1,
    },
});
