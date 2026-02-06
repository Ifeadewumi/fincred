import { api } from './client';
import type {
    ConversationSession,
    SendMessageRequest,
    ChatResponse,
    CheckIn,
    CreateCheckInRequest,
} from '@/types/chat.types';

export const chatApi = {
    sendMessage: async (data: SendMessageRequest) => {
        const response = await api.post<ChatResponse>('/chat/message', data);
        return response.data;
    },

    startSession: async (intent: string = 'general') => {
        const response = await api.post<{ session_id: string; greeting: string; intent: string }>('/chat/start', { intent });
        return response.data;
    },

    /**
     * Get information about a conversation session.
     */
    getSession: async (sessionId: string) => {
        const response = await api.get<{
            session_id: string;
            intent: string;
            message_count: number;
            created_at: string;
            updated_at: string;
        }>(`/chat/session/${sessionId}`);
        return response.data;
    },

    /**
     * End and clear a conversation session.
     */
    endSession: async (sessionId: string): Promise<void> => {
        await api.delete(`/chat/session/${sessionId}`);
    },

    /**
     * Refresh the context for an existing session.
     */
    refreshSession: async (sessionId: string) => {
        const response = await api.post<{ status: string; message: string }>(`/chat/session/${sessionId}/refresh`);
        return response.data;
    },

    /**
     * Check LLM service health.
     */
    checkHealth: async () => {
        const response = await api.get<{
            llm_available: boolean;
            active_sessions: number;
            providers: string[];
        }>('/chat/health');
        return response.data;
    },

    // For streaming, we'll need to use EventSource
    // This will be implemented when building the chat UI
};

export const checkInApi = {
    getAll: async () => {
        const response = await api.get<CheckIn[]>('/checkins');
        return response.data;
    },

    create: async (data: CreateCheckInRequest) => {
        const response = await api.post<CheckIn>('/checkins', data);
        return response.data;
    },

    getLatest: async () => {
        // Get list and return first item (most recent)
        const response = await api.get<CheckIn[]>('/checkins?limit=1');
        return response.data[0] || null;
    },
};
