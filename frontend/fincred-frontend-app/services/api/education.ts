import { api } from './client';
import type { EducationSnippet, EducationSnippetFilters } from '@/types/education.types';

export const educationApi = {
    /**
     * Get education snippets with optional filters.
     */
    getSnippets: async (filters?: EducationSnippetFilters): Promise<EducationSnippet[]> => {
        const response = await api.get<EducationSnippet[]>('/education/snippets', {
            params: {
                topic: filters?.topic,
                context_goal_type: filters?.context_goal_type,
                context_feasibility: filters?.context_feasibility,
                limit: filters?.limit ?? 20,
                offset: filters?.offset ?? 0,
            },
        });
        return response.data;
    },

    /**
     * Get a single education snippet by ID.
     */
    getById: async (id: string): Promise<EducationSnippet> => {
        const response = await api.get<EducationSnippet>(`/education/snippets/${id}`);
        return response.data;
    },
};
