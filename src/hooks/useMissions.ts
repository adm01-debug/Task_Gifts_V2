import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { missionsService, type DepartmentMission, type MissionWithProgress } from "@/services/missionsService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const missionKeys = {
  all: ["missions"] as const,
  byDepartment: (deptId: string | null) => [...missionKeys.all, "department", deptId] as const,
  progress: (userId: string) => [...missionKeys.all, "progress", userId] as const,
  rankings: (deptId: string, period: string) => [...missionKeys.all, "rankings", deptId, period] as const,
  allRankings: (period: string) => [...missionKeys.all, "allRankings", period] as const,
};

export function useDepartmentMissions(departmentId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: missionKeys.byDepartment(departmentId),
    queryFn: async () => {
      const missions = await missionsService.getMissionsByDepartment(departmentId);
      
      if (user) {
        const missionIds = missions.map(m => m.id);
        const progress = await missionsService.getUserProgress(user.id, missionIds);
        const progressMap = new Map(progress.map(p => [p.mission_id, p]));
        
        return missions.map(mission => ({
          ...mission,
          progress: progressMap.get(mission.id),
        })) as MissionWithProgress[];
      }
      
      return missions as MissionWithProgress[];
    },
    staleTime: 30000,
  });
}

export function useAllMissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: missionKeys.all,
    queryFn: async () => {
      const missions = await missionsService.getAllMissions();
      
      if (user) {
        const missionIds = missions.map(m => m.id);
        const progress = await missionsService.getUserProgress(user.id, missionIds);
        const progressMap = new Map(progress.map(p => [p.mission_id, p]));
        
        return missions.map(mission => ({
          ...mission,
          progress: progressMap.get(mission.id),
        })) as MissionWithProgress[];
      }
      
      return missions as MissionWithProgress[];
    },
    staleTime: 30000,
  });
}

export function useUpdateMissionProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ missionId, increment = 1 }: { missionId: string; increment?: number }) =>
      missionsService.updateProgress(user!.id, missionId, increment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: missionKeys.all });
    },
  });
}

export function useClaimMissionReward() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (progressId: string) => missionsService.claimReward(user!.id, progressId),
    onSuccess: ({ xp, coins }) => {
      queryClient.invalidateQueries({ queryKey: missionKeys.all });
      toast.success(`🎉 Recompensa coletada! +${xp} XP${coins > 0 ? ` +${coins} 🪙` : ""}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao coletar recompensa");
    },
  });
}

export function useDepartmentRankings(departmentId: string, periodType: "weekly" | "monthly" = "weekly") {
  return useQuery({
    queryKey: missionKeys.rankings(departmentId, periodType),
    queryFn: () => missionsService.getDepartmentRankings(departmentId, periodType),
    enabled: !!departmentId,
    staleTime: 60000,
  });
}

export function useAllRankings(periodType: "weekly" | "monthly" = "weekly") {
  return useQuery({
    queryKey: missionKeys.allRankings(periodType),
    queryFn: () => missionsService.getAllRankings(periodType),
    staleTime: 60000,
  });
}
