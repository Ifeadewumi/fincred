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
