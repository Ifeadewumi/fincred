import { api } from './client';
import type {
    ConversationSession,
    SendMessageRequest,
    ChatResponse,
    CheckIn,
    CreateCheckInRequest,
} from '@/types/chat.types';

export const chatApi = {
    getSessions: async () => {
        const response = await api.get<ConversationSession[]>('/chat/sessions');
        return response.data;
    },

    sendMessage: async (data: SendMessageRequest) => {
        const response = await api.post<ChatResponse>('/chat/message', data);
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
        const response = await api.get<CheckIn>('/checkins/latest');
        return response.data;
    },
};
