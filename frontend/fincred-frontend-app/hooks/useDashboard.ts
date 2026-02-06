import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api/dashboard';

export const useDashboard = () => {
    const dashboardQuery = useQuery({
        queryKey: ['dashboard'],
        queryFn: dashboardApi.getSummary,
    });

    return {
        dashboard: dashboardQuery.data,
        goals: dashboardQuery.data?.goals || [],
        stats: dashboardQuery.data?.stats,
        milestones: dashboardQuery.data?.recent_milestones || [],
        isLoading: dashboardQuery.isLoading,
        error: dashboardQuery.error,
        refetch: dashboardQuery.refetch,
    };
};
