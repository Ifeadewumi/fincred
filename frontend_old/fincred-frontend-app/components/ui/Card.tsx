import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '@/theme';
import { useColorScheme } from '@/components/useColorScheme';

interface Props extends ViewProps {
    variant?: 'elevated' | 'outline' | 'flat';
    padding?: keyof typeof spacing;
}

export const Card: React.FC<Props> = ({
    variant = 'elevated',
    padding = 'md',
    style,
    children,
    ...props
}) => {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const containerStyle: ViewStyle[] = [
        styles.base,
        { padding: spacing[padding] },
        isDark ? styles.dark : styles.light,
    ];

    if (variant === 'elevated') {
        containerStyle.push(shadows.md);
    } else if (variant === 'outline') {
        containerStyle.push(styles.outline);
    }

    return (
        <View style={[containerStyle, style as ViewStyle]} {...props}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    light: {
        backgroundColor: colors.white,
    },
    dark: {
        backgroundColor: colors.surfaceDark,
        borderColor: colors.gray800,
        borderWidth: 1,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.gray200,
    }
});
