import { useQuery } from "@tanstack/react-query";
import {
  engagementDiagnosticsService,
  getPillarBenchmark,
  type DiagnosticsFilters,
} from "@/services/engagementDiagnosticsService";

const STALE = 5 * 60 * 1000;

function key(name: string, filters: DiagnosticsFilters) {
  return ["engagement-diagnostics", name, filters.departmentId ?? "all", filters.days ?? 90];
}

export function useEngagementOverview(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: key("overview", filters),
    queryFn: () => engagementDiagnosticsService.getOverview(filters),
    staleTime: STALE,
  });
}

export function useEngagementPillarScores(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: key("pillars", filters),
    queryFn: () => engagementDiagnosticsService.getPillarScores(filters),
    staleTime: STALE,
  });
}

export function useEngagementFactorScores(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: key("factors", filters),
    queryFn: () => engagementDiagnosticsService.getFactorScores(filters),
    staleTime: STALE,
  });
}

export function useEngagementNps(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: key("nps", filters),
    queryFn: () => engagementDiagnosticsService.getNps(filters),
    staleTime: STALE,
  });
}

export function useEngagementNpsHistory(
  filters: DiagnosticsFilters & { months?: number; bucket?: "month" | "week" } = {},
) {
  return useQuery({
    queryKey: [
      "engagement-diagnostics",
      "nps-history",
      filters.departmentId ?? "all",
      filters.months ?? 12,
      filters.bucket ?? "month",
    ],
    queryFn: () => engagementDiagnosticsService.getNpsHistory(filters),
    staleTime: STALE,
  });
}

export function useEngagementCorrelations(days = 180) {
  return useQuery({
    queryKey: ["engagement-diagnostics", "correlations", days],
    queryFn: () => engagementDiagnosticsService.getCorrelations(days),
    staleTime: STALE,
  });
}

export function useEngagementBenchmark(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: key("benchmark", filters),
    queryFn: () => getPillarBenchmark(filters),
    staleTime: STALE,
  });
}
