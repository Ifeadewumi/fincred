export type GoalType = 'DEBT_PAYOFF' | 'SAVINGS' | 'INVESTMENT' | 'CUSTOM';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
export type GoalPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Goal {
    id: string;
    user_id: string;
    goal_type: GoalType;
    name: string;
    description?: string;
    target_amount: number;
    target_date: string;
    priority: GoalPriority;
    status: GoalStatus;
    why_text?: string;
    created_at: string;
    updated_at: string;
}

export interface GoalProgress {
    goal_id: string;
    current_amount: number;
    last_updated: string;
    percent_complete: number;
}

export interface CreateGoalRequest {
    goal_type: GoalType;
    name: string;
    description?: string;
    target_amount: number;
    target_date: string;
    priority?: GoalPriority;
    why_text?: string;
}

export interface UpdateGoalRequest {
    name?: string;
    description?: string;
    target_amount?: number;
    target_date?: string;
    priority?: GoalPriority;
    status?: GoalStatus;
    why_text?: string;
}

export interface ActionPlan {
    id: string;
    goal_id: string;
    action_type: 'AUTOMATED_TRANSFER' | 'MANUAL_HABIT' | 'DEBT_PAYMENT';
    frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    amount: number;
    day_of_week?: number;
    day_of_month?: number;
    is_active: boolean;
    created_at: string;
}
