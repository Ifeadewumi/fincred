import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from '../ui';
import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    count: number;
}

export const StreakCounter: React.FC<Props> = ({ count }) => {
    return (
        <Card variant="flat" padding="sm" style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="flame" size={24} color={colors.warning} />
                <View style={styles.textContainer}>
                    <Text variant="h3" style={styles.count}>{count}</Text>
                    <Text variant="caption" color={colors.textSecondary}>Day Streak</Text>
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.warning + '10', // 10% opacity warning color
        borderWidth: 1,
        borderColor: colors.warning + '30',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: spacing.sm,
    },
    count: {
        lineHeight: 24,
        color: colors.warning,
        fontWeight: '700',
    }
});
