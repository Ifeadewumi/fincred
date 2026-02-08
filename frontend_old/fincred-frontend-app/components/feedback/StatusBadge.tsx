import React from 'react';
import { Badge, BadgeVariant } from '../ui/Badge';
import { colors } from '@/theme';

interface Props {
    status: 'on_track' | 'behind' | 'at_risk' | 'completed' | 'paused';
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
    const getVariant = (): { label: string; variant: BadgeVariant } => {
        switch (status) {
            case 'on_track':
                return { label: 'On Track', variant: 'success' };
            case 'behind':
                return { label: 'Behind', variant: 'warning' };
            case 'at_risk':
                return { label: 'At Risk', variant: 'danger' };
            case 'completed':
                return { label: 'Completed', variant: 'info' };
            default:
                return { label: 'Paused', variant: 'gray' };
        }
    };

    const { label, variant } = getVariant();

    return <Badge label={label} variant={variant} />;
};
