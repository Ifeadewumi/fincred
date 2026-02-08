import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/services/api/chat';

export const useChatSession = () => {
    const queryClient = useQueryClient();
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    const startSessionMutation = useMutation({
        mutationFn: (intent: string = 'general') => chatApi.startSession(intent),
        onSuccess: (data) => {
            setCurrentSessionId(data.session_id);
        },
    });

    const endSessionMutation = useMutation({
        mutationFn: (sessionId: string) => chatApi.endSession(sessionId),
        onSuccess: () => {
            setCurrentSessionId(null);
        },
    });

    const refreshSessionMutation = useMutation({
        mutationFn: (sessionId: string) => chatApi.refreshSession(sessionId),
    });

    const sessionQuery = useQuery({
        queryKey: ['chatSession', currentSessionId],
        queryFn: () => chatApi.getSession(currentSessionId!),
        enabled: !!currentSessionId,
    });

    const healthQuery = useQuery({
        queryKey: ['chatHealth'],
        queryFn: chatApi.checkHealth,
        refetchInterval: 60000, // Check every minute
        staleTime: 30000,
    });

    const startSession = useCallback(
        async (intent: string = 'general') => {
            return startSessionMutation.mutateAsync(intent);
        },
        [startSessionMutation]
    );

    const endSession = useCallback(async () => {
        if (currentSessionId) {
            await endSessionMutation.mutateAsync(currentSessionId);
        }
    }, [currentSessionId, endSessionMutation]);

    const refreshSession = useCallback(async () => {
        if (currentSessionId) {
            await refreshSessionMutation.mutateAsync(currentSessionId);
        }
    }, [currentSessionId, refreshSessionMutation]);

    return {
        // Session state
        currentSessionId,
        setCurrentSessionId,
        session: sessionQuery.data,
        isSessionLoading: sessionQuery.isLoading,

        // Session actions
        startSession,
        endSession,
        refreshSession,
        isStarting: startSessionMutation.isPending,
        isEnding: endSessionMutation.isPending,
        isRefreshing: refreshSessionMutation.isPending,

        // Greeting from start session
        greeting: startSessionMutation.data?.greeting,

        // Health check
        llmHealth: healthQuery.data,
        isLlmAvailable: healthQuery.data?.llm_available ?? false,
    };
};
