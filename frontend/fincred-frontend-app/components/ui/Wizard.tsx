import React, { useState } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Button, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface WizardStep {
    title: string;
    component: (props: { data: any; updateData: (newData: any) => void; onNext: () => void; onBack: () => void }) => React.ReactNode;
}

interface WizardProps {
    steps: WizardStep[];
    onComplete: (data: any) => void;
    onCancel: () => void;
    style?: ViewStyle;
}

export function Wizard({ steps, onComplete, onCancel, style }: WizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<any>({});

    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    const updateData = (newData: any) => {
        setFormData((prev: any) => ({ ...prev, ...newData }));
    };

    const handleNext = () => {
        if (isLastStep) {
            onComplete(formData);
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (isFirstStep) {
            onCancel();
        } else {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = steps[currentStep];

    return (
        <View style={[styles.container, style]}>
            {/* Header / Progress */}
            <View style={styles.header}>
                <View style={styles.progressContainer}>
                    {steps.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressBar,
                                {
                                    backgroundColor: index <= currentStep ? colors.primary : colors.gray200,
                                    flex: 1,
                                    marginHorizontal: 2,
                                },
                            ]}
                        />
                    ))}
                </View>
                <Text variant="h3" style={styles.stepTitle}>
                    {step.title}
                </Text>
            </View>

            {/* Step Content */}
            <View style={styles.content}>
                {step.component({ data: formData, updateData, onNext: handleNext, onBack: handleBack })}
            </View>

            {/* Footer Navigation */}
            <View style={styles.footer}>
                <Button
                    title={isFirstStep ? 'Cancel' : 'Back'}
                    variant="outline"
                    onPress={handleBack}
                    style={styles.navButton}
                />
                <Button
                    title={isLastStep ? 'Create Goal' : 'Continue'}
                    variant="primary"
                    onPress={handleNext}
                    style={[styles.navButton, { marginLeft: spacing.md }]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.md,
        paddingTop: spacing.lg,
    },
    progressContainer: {
        flexDirection: 'row',
        height: 4,
        marginBottom: spacing.lg,
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    stepTitle: {
        marginBottom: spacing.sm,
    },
    content: {
        flex: 1,
        padding: spacing.md,
    },
    footer: {
        flexDirection: 'row',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.gray100,
        backgroundColor: colors.background,
    },
    navButton: {
        flex: 1,
    },
});
