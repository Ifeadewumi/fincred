// Education types matching backend app/schemas/education.py

export type EducationTopic =
    | 'debt_methods'
    | 'emergency_fund'
    | 'fire_basics'
    | 'savings_strategies'
    | 'investing_basics';

export type EducationContextFeasibility = 'Comfortable' | 'Tight' | 'Unrealistic';

export interface EducationSnippet {
    id: string;
    topic: EducationTopic;
    short_title: string;
    content: string;
    context_goal_type?: string;
    context_feasibility?: EducationContextFeasibility;
    created_at: string;
    updated_at: string;
}

export interface EducationSnippetFilters {
    topic?: EducationTopic;
    context_goal_type?: string;
    context_feasibility?: EducationContextFeasibility;
    limit?: number;
    offset?: number;
}
