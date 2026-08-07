import { useQuery } from "@tanstack/react-query";
import { competencyService, CompetencyData } from "@/services/competencyService";

export const competencyKeys = {
  all: ["competencies"] as const,
  user: (userId: string) => [...competencyKeys.all, userId] as const,
};

export function useCompetencies(userId: string | undefined) {
  return useQuery<CompetencyData[]>({
    queryKey: competencyKeys.user(userId || ""),
    queryFn: () => competencyService.getUserCompetencies(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
