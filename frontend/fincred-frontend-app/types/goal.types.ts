export type GoalType = 'debt_payoff' | 'emergency_fund' | 'short_term_saving' | 'fire_starter';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type GoalPriority = 'High' | 'Medium' | 'Low';

export interface Goal {
    id: string;
    user_id: string;
    type: GoalType;
    name: string;
    description?: string;
    target_amount: number;
    target_date: string;
    priority: GoalPriority;
    status: GoalStatus;
    primary_flag: boolean;
    why_text?: string;
    created_at: string;
    updated_at: string;
}

export interface GoalProgress {
    id: string;
    goal_id: string;
    user_id: string;
    current_balance: number;
    source: string;
    note?: string;
    recorded_at: string;
}

export interface CreateGoalRequest {
    type: GoalType;
    name: string;
    description?: string;
    target_amount: number;
    target_date: string;
    priority: GoalPriority;
    primary_flag?: boolean;
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
