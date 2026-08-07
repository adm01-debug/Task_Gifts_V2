import { useQuery } from "@tanstack/react-query";
import { engagementReportsService } from "@/services/engagementReportsService";

export function useCompletionTrend(months: number = 6) {
  return useQuery({
    queryKey: ["engagement", "completionTrend", months],
    queryFn: () => engagementReportsService.getCompletionTrend(months),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDepartmentPerformance() {
  return useQuery({
    queryKey: ["engagement", "departmentPerformance"],
    queryFn: () => engagementReportsService.getDepartmentPerformance(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuestDifficultyDistribution() {
  return useQuery({
    queryKey: ["engagement", "difficultyDistribution"],
    queryFn: () => engagementReportsService.getQuestDifficultyDistribution(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyEngagement() {
  return useQuery({
    queryKey: ["engagement", "weeklyEngagement"],
    queryFn: () => engagementReportsService.getWeeklyEngagement(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopQuests(limit: number = 5) {
  return useQuery({
    queryKey: ["engagement", "topQuests", limit],
    queryFn: () => engagementReportsService.getTopQuests(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStrugglingAreas() {
  return useQuery({
    queryKey: ["engagement", "strugglingAreas"],
    queryFn: () => engagementReportsService.getStrugglingAreas(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEngagementMetrics() {
  return useQuery({
    queryKey: ["engagement", "metrics"],
    queryFn: () => engagementReportsService.getEngagementMetrics(),
    staleTime: 5 * 60 * 1000,
  });
}
