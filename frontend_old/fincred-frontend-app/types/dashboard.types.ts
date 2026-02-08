// Dashboard types matching backend app/schemas/dashboard.py

import type { GoalType, GoalPriority } from './goal.types';

export type ProgressStatus =
    | 'on_track'
    | 'slightly_behind'
    | 'off_track'
    | 'completed'
    | 'not_started';

export interface DashboardGoal {
    id: string;
    name: string;
    type: GoalType;
    target_amount: number;
    current_balance: number;
    progress_percentage: number;
    status_label: ProgressStatus;
    target_date: string;
    priority: GoalPriority;
}

export interface DashboardStats {
    total_goals: number;
    active_goals: number;
    completed_goals: number;
    total_saved: number;
    current_streak: number;
    longest_streak: number;
}

export interface DashboardResponse {
    goals: DashboardGoal[];
    stats: DashboardStats;
    recent_milestones: string[];
}
