import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Card, Text } from '../ui';
import { colors, spacing } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import type { EducationSnippet, EducationTopic } from '@/types/education.types';

interface Props {
    snippet: EducationSnippet;
    onPress?: () => void;
}

export const EducationCard: React.FC<Props> = ({ snippet, onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
            <Card variant="outline" style={styles.container}>
                <View style={styles.header}>
                    <View style={[styles.topicIcon, { backgroundColor: getTopicColor(snippet.topic) + '15' }]}>
                        <Ionicons
                            name={getTopicIcon(snippet.topic)}
                            size={20}
                            color={getTopicColor(snippet.topic)}
                        />
                    </View>
                    <View style={styles.topicBadge}>
                        <Text variant="caption" color={getTopicColor(snippet.topic)}>
                            {getTopicLabel(snippet.topic)}
                        </Text>
                    </View>
                </View>
                <Text variant="h4" style={styles.title}>{snippet.title}</Text>
                <Text variant="bodySmall" color={colors.textSecondary} numberOfLines={3}>
                    {snippet.content}
                </Text>
                {onPress && (
                    <View style={styles.footer}>
                        <Text variant="caption" color={colors.primary}>Read more</Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );
};

function getTopicIcon(topic: EducationTopic): any {
    switch (topic) {
        case 'saving': return 'wallet-outline';
        case 'budgeting': return 'calculator-outline';
        case 'debt': return 'card-outline';
        case 'investing': return 'trending-up-outline';
        case 'credit': return 'shield-checkmark-outline';
        default: return 'bulb-outline';
    }
}

function getTopicLabel(topic: EducationTopic): string {
    switch (topic) {
        case 'saving': return 'Saving';
        case 'budgeting': return 'Budgeting';
        case 'debt': return 'Debt';
        case 'investing': return 'Investing';
        case 'credit': return 'Credit';
        default: return topic;
    }
}

function getTopicColor(topic: EducationTopic): string {
    switch (topic) {
        case 'saving': return colors.success;
        case 'budgeting': return colors.primary;
        case 'debt': return colors.warning;
        case 'investing': return colors.primary;
        case 'credit': return colors.success;
        default: return colors.gray500;
    }
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    topicIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topicBadge: {
        marginLeft: spacing.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        backgroundColor: colors.gray100,
    },
    title: {
        marginBottom: spacing.xs,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: 4,
    },
});
