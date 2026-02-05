import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { typography, colors } from '@/theme';
import { useColorScheme } from '@/components/useColorScheme';

type TypographyVariant = keyof typeof typography;

interface Props extends TextProps {
    variant?: TypographyVariant;
    color?: string;
    align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    italic?: boolean;
}

export const Text: React.FC<Props> = ({
    variant = 'body',
    color,
    align = 'left',
    italic = false,
    style,
    children,
    ...props
}) => {
    const colorScheme = useColorScheme() ?? 'light';

    const defaultColor = colorScheme === 'dark' ? colors.textDark : colors.text;

    return (
        <RNText
            style={[
                typography[variant],
                {
                    color: color || defaultColor,
                    textAlign: align,
                    fontStyle: italic ? 'italic' : 'normal'
                },
                style
            ]}
            {...props}
        >
            {children}
        </RNText>
    );
};
