export type ConversationIntent =
    | 'onboarding'
    | 'goal_discovery'
    | 'planning'
    | 'check_in'
    | 'general_coaching'
    | 'adjustment';

export interface ConversationSession {
    session_id: string;
    user_id: string;
    intent: ConversationIntent;
    context_summary?: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface SendMessageRequest {
    session_id?: string;
    message: string;
    intent?: ConversationIntent;
}

export interface ChatResponse {
    session_id: string;
    response: string;
    intent: ConversationIntent;
}

export interface CheckIn {
    id: string;
    user_id: string;
    planned_payment_done: 'yes' | 'no' | 'partial';
    spending_vs_plan: 'under' | 'on_target' | 'over';
    mood_score: number;
    notes?: string;
    created_at: string;
}

export interface CreateCheckInRequest {
    planned_payment_done: 'yes' | 'no' | 'partial';
    spending_vs_plan: 'under' | 'on_target' | 'over';
    mood_score: number;
    notes?: string;
}
