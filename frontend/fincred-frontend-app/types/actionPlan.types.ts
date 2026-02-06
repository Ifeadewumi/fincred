// Action Plan types matching backend app/schemas/action_plan.py

export type ActionPlanType = 'automated_transfer' | 'manual_habit';

export type ActionPlanFrequency = 'monthly' | 'biweekly' | 'weekly';

export interface ActionPlan {
    id: string;
    user_id: string;
    goal_id: string;
    type: ActionPlanType;
    amount: number;
    frequency: ActionPlanFrequency;
    day_of_period?: number;
    is_confirmed_set_up: boolean;
    created_at: string;
    updated_at: string;
}

export interface ActionPlanCreate {
    goal_id: string;
    type: ActionPlanType;
    amount: number;
    frequency: ActionPlanFrequency;
    day_of_period?: number;
    is_confirmed_set_up?: boolean;
}

export interface ActionPlanUpdate {
    type?: ActionPlanType;
    amount?: number;
    frequency?: ActionPlanFrequency;
    day_of_period?: number;
    is_confirmed_set_up?: boolean;
}
