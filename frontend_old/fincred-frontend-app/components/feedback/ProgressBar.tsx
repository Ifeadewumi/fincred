import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '@/theme';

interface Props {
    progress: number; // 0 to 1
    height?: number;
    color?: string;
    style?: ViewStyle;
}

export const ProgressBar: React.FC<Props> = ({
    progress,
    height = 8,
    color = colors.primary,
    style
}) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);

    return (
        <View style={[styles.container, { height }, style]}>
            <View
                style={[
                    styles.fill,
                    {
                        width: `${clampedProgress * 100}%`,
                        backgroundColor: color
                    }
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.gray100,
        borderRadius: borderRadius.full,
        width: '100%',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: borderRadius.full,
    },
});
