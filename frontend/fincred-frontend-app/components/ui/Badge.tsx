import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/theme';
import { Text } from './Typography';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'gray';

interface Props {
    label: string;
    variant?: BadgeVariant;
    style?: ViewStyle;
}

export const Badge: React.FC<Props> = ({ label, variant = 'gray', style }) => {
    const getColors = () => {
        switch (variant) {
            case 'success':
                return {
                    background: colors.successLight + '20', // 20 is hex for 12.5% opacity
                    text: colors.success
                };
            case 'warning':
                return {
                    background: colors.warning + '20',
                    text: colors.warning
                };
            case 'danger':
                return {
                    background: colors.danger + '20',
                    text: colors.danger
                };
            case 'info':
                return {
                    background: colors.primary + '20',
                    text: colors.primary
                };
            default:
                return {
                    background: colors.gray100,
                    text: colors.gray600
                };
        }
    };

    const { background, text } = getColors();

    return (
        <View style={[styles.container, { backgroundColor: background }, style]}>
            <Text
                variant="caption"
                color={text}
                style={styles.text}
            >
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs / 2,
        borderRadius: borderRadius.full,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: '600',
        textTransform: 'uppercase',
    },
});
