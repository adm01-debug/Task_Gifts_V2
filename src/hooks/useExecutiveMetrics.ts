import { useQuery } from "@tanstack/react-query";
import { executiveService, ExecutiveMetrics, MonthlyTrend, DepartmentMetric } from "@/services/executiveService";

export const executiveKeys = {
  all: ['executive'] as const,
  metrics: () => [...executiveKeys.all, 'metrics'] as const,
  trends: () => [...executiveKeys.all, 'trends'] as const,
  departments: () => [...executiveKeys.all, 'departments'] as const,
};

export function useExecutiveMetrics() {
  return useQuery({
    queryKey: executiveKeys.metrics(),
    queryFn: () => executiveService.getMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useMonthlyTrends() {
  return useQuery({
    queryKey: executiveKeys.trends(),
    queryFn: () => executiveService.getMonthlyTrends(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDepartmentMetrics() {
  return useQuery({
    queryKey: executiveKeys.departments(),
    queryFn: () => executiveService.getDepartmentMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
