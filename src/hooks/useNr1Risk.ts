import { useQuery } from "@tanstack/react-query";
import { nr1RiskService } from "@/services/nr1RiskService";
import type { DiagnosticsFilters } from "@/services/engagementDiagnosticsService";

const STALE = 5 * 60 * 1000;

export function useNr1RiskMatrix(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: ["nr1", "matrix", filters.departmentId ?? null, filters.days ?? 90],
    queryFn: () => nr1RiskService.getRiskMatrix(filters),
    staleTime: STALE,
  });
}

export function useNr1Summary(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: ["nr1", "summary", filters.departmentId ?? null, filters.days ?? 90],
    queryFn: () => nr1RiskService.getSummary(filters),
    staleTime: STALE,
  });
}
