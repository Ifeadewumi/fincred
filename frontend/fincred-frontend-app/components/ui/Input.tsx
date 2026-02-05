import React from 'react';
import {
    TextInput,
    TextInputProps,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { Text } from './Typography';

interface Props extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<Props> = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text variant="label" style={styles.label}>
                    {label}
                </Text>
            )}
            <TextInput
                style={[
                    styles.input,
                    typography.body,
                    error ? styles.inputError : null,
                    style
                ]}
                placeholderTextColor={colors.gray400}
                {...props}
            />
            {error && (
                <Text variant="caption" color={colors.danger} style={styles.errorText}>
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        width: '100%',
    },
    label: {
        marginBottom: spacing.xs,
        color: colors.textSecondary,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.gray200,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        backgroundColor: colors.white,
        color: colors.text,
    },
    inputError: {
        borderColor: colors.danger,
    },
    errorText: {
        marginTop: spacing.xs,
    },
});
