import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Text, Button, Input, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '@/services/api/user';

const PERSONAS = [
    {
        id: 'debt_crusher',
        title: 'Crush Debt',
        icon: 'card-outline',
        description: 'I want to pay off my loans and credit cards.'
    },
    {
        id: 'safety_net',
        title: 'Build Safety Net',
        icon: 'shield-checkmark-outline',
        description: 'I want to save for emergencies and peace of mind.'
    },
    {
        id: 'fire_starter',
        title: 'Start FIRE',
        icon: 'flame-outline',
        description: 'I want to invest aggressively for financial independence.'
    }
];

export default function PersonaScreen() {
    const router = useRouter();
    const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [country, setCountry] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleContinue = async () => {
        if (!selectedPersona) {
            Alert.alert('Selection Required', 'Please select a goal that matches you best.');
            return;
        }
        if (!name || !age || !country) {
            Alert.alert('Missing Information', 'Please fill in all details to help us customize your plan.');
            return;
        }

        try {
            setIsSubmitting(true);
            await userApi.updateProfile({
                full_name: name,
                age_range: age, // Simplified for now, backend expects range string
                country: country,
                persona_hint: selectedPersona,
            });

            // Navigate to next step
            router.push('/snapshot');
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Coach Intro */}
            <View style={styles.coachContainer}>
                <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={32} color={colors.white} />
                </View>
                <View style={styles.bubble}>
                    <Text variant="body">
                        Hi! I'm your FinCred coach. What brings you here today?
                    </Text>
                </View>
            </View>

            <Text variant="h3" style={styles.sectionTitle}>Choose your path</Text>

            <View style={styles.personaGrid}>
                {PERSONAS.map((persona) => (
                    <TouchableOpacity
                        key={persona.id}
                        style={[
                            styles.personaCard,
                            selectedPersona === persona.id && styles.personaCardSelected
                        ]}
                        onPress={() => setSelectedPersona(persona.id)}
                    >
                        <Ionicons
                            name={persona.icon as any}
                            size={32}
                            color={selectedPersona === persona.id ? colors.primary : colors.gray500}
                        />
                        <Text
                            variant="h4"
                            style={styles.personaTitle}
                            color={selectedPersona === persona.id ? colors.primary : colors.text}
                        >
                            {persona.title}
                        </Text>
                        <Text variant="caption" color={colors.textSecondary} align="center">
                            {persona.description}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text variant="h3" style={styles.sectionTitle}>Tell us about yourself</Text>

            <View style={styles.form}>
                <Input
                    label="What should we call you?"
                    placeholder="Your Name"
                    value={name}
                    onChangeText={setName}
                />
                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Input
                            label="Age"
                            placeholder="e.g. 25"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={setAge}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Input
                            label="Country"
                            placeholder="e.g. USA"
                            value={country}
                            onChangeText={setCountry}
                        />
                    </View>
                </View>
            </View>

            <Button
                title="Continue"
                onPress={handleContinue}
                loading={isSubmitting}
                size="lg"
                style={styles.continueButton}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
    },
    coachContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.xl,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    bubble: {
        flex: 1,
        backgroundColor: colors.gray100,
        padding: spacing.md,
        borderRadius: 16,
        borderTopLeftRadius: 4,
    },
    sectionTitle: {
        marginBottom: spacing.md,
        marginTop: spacing.md,
    },
    personaGrid: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    personaCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    personaCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primary + '05',
    },
    personaTitle: {
        marginVertical: spacing.sm,
    },
    form: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    halfInput: {
        flex: 1,
    },
    continueButton: {
        marginTop: spacing.sm,
        marginBottom: spacing.xxl,
    },
});
