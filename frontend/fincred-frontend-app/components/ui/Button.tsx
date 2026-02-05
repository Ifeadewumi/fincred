import React from 'react';
import {
    TouchableOpacity,
    TouchableOpacityProps,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle
} from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';
import { Text } from './Typography';

interface Props extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export const Button: React.FC<Props> = ({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    style,
    disabled,
    ...props
}) => {
    const isSecondary = variant === 'secondary';
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';
    const isDanger = variant === 'danger';

    const containerStyle: ViewStyle[] = [
        styles.base,
        styles[size],
        styles[variant],
    ];

    if (disabled || loading) {
        containerStyle.push(styles.disabled);
    }

    const textVariant = size === 'sm' ? 'bodySmall' : 'button';

    let textColor = colors.white;
    if (isOutline || isGhost) textColor = colors.primary;
    if (isSecondary) textColor = colors.text;
    if (isDanger && (isOutline || isGhost)) textColor = colors.danger;

    return (
        <TouchableOpacity
            style={[containerStyle, style as ViewStyle]}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={textColor} size="small" />
            ) : (
                <Text variant={textVariant} color={textColor} style={styles.text}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sm: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
    md: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    lg: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.gray100,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    danger: {
        backgroundColor: colors.danger,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontWeight: '600',
    }
});
