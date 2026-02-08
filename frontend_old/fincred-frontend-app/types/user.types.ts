export interface User {
    id: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    profile?: UserProfile;
}

export interface UserProfile {
    id: string;
    user_id: string;
    full_name?: string;
    age_range?: string;
    country?: string;
    currency?: string;
    persona_hint?: string;
    preferred_checkin_day_of_week?: number;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export interface UpdateProfileRequest {
    full_name?: string;
    age_range?: string;
    country?: string;
    currency?: string;
    persona_hint?: string;
    preferred_checkin_day_of_week?: number;
}
