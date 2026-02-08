// Check-in types matching backend app/schemas/tracking.py

export type PlannedPayments = 'yes' | 'no' | 'partial';
export type SpendingVsPlan = 'under' | 'on' | 'over';
export type MoodScore = 1 | 2 | 3 | 4 | 5;

export interface CheckIn {
    id: string;
    user_id: string;
    period_start?: string;
    period_end?: string;
    made_planned_payments: PlannedPayments;
    spending_vs_plan: SpendingVsPlan;
    mood_score: MoodScore;
    comment?: string;
    completed_at: string;
}

export interface CheckInCreate {
    period_start?: string;
    period_end?: string;
    made_planned_payments: PlannedPayments;
    spending_vs_plan: SpendingVsPlan;
    mood_score: MoodScore;
    comment?: string;
}

export interface CheckInUpdate {
    period_start?: string;
    period_end?: string;
    made_planned_payments?: PlannedPayments;
    spending_vs_plan?: SpendingVsPlan;
    mood_score?: MoodScore;
    comment?: string;
}
