import { useQuery } from '@tanstack/react-query';
import { educationApi } from '@/services/api/education';
import type { EducationSnippetFilters, EducationTopic } from '@/types/education.types';

export const useEducation = (filters?: EducationSnippetFilters) => {
    const snippetsQuery = useQuery({
        queryKey: ['education', 'snippets', filters],
        queryFn: () => educationApi.getSnippets(filters),
    });

    return {
        snippets: snippetsQuery.data || [],
        isLoading: snippetsQuery.isLoading,
        error: snippetsQuery.error,
        refetch: snippetsQuery.refetch,
    };
};

export const useEducationByTopic = (topic: EducationTopic) => {
    return useEducation({ topic });
};

export const useEducationSnippet = (id: string) => {
    return useQuery({
        queryKey: ['education', 'snippet', id],
        queryFn: () => educationApi.getById(id),
        enabled: !!id,
    });
};
