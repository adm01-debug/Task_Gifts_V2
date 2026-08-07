import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService, AttendanceRecord, AttendanceStreak, CheckInResult } from "@/services/attendanceService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

export const attendanceKeys = {
  all: ['attendance'] as const,
  settings: () => [...attendanceKeys.all, 'settings'] as const,
  streak: (userId: string) => [...attendanceKeys.all, 'streak', userId] as const,
  today: (userId: string) => [...attendanceKeys.all, 'today', userId] as const,
  recent: (userId: string, days: number) => [...attendanceKeys.all, 'recent', userId, days] as const,
  team: (date?: string) => [...attendanceKeys.all, 'team', date] as const,
  leaderboard: () => [...attendanceKeys.all, 'leaderboard'] as const,
};

export function useAttendanceSettings(departmentId?: string) {
  return useQuery({
    queryKey: [...attendanceKeys.settings(), departmentId],
    queryFn: () => attendanceService.getSettings(departmentId),
  });
}

export function useUserStreak() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: attendanceKeys.streak(user?.id || ''),
    queryFn: () => attendanceService.getUserStreak(user?.id || ''),
    enabled: !!user?.id,
  });
}

export function useTodayAttendance() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: attendanceKeys.today(user?.id || ''),
    queryFn: () => attendanceService.getTodayRecord(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useRecentAttendance(days: number = 7) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: attendanceKeys.recent(user?.id || '', days),
    queryFn: () => attendanceService.getRecentRecords(user?.id || '', days),
    enabled: !!user?.id,
  });
}

export function useCheckIn() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CheckInResult> => {
      if (!user?.id) throw new Error('User not authenticated');
      return attendanceService.checkIn(user.id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['combo'] });
      
      if (result.isPunctual) {
        const comboText = result.bonusXp > 0 
          ? ` (${result.xpEarned - result.bonusXp} + ${result.bonusXp} combo ${result.comboMultiplier}x)`
          : '';
        
        if (result.streakMilestoneReached) {
          toast.success(`🔥 Check-in pontual! Streak de ${result.newStreak} dias! +${result.xpEarned} XP${comboText}`, {
            duration: 5000,
          });
        } else {
          toast.success(`✅ Check-in pontual! +${result.xpEarned} XP${comboText}`, {
            duration: 3000,
          });
        }
      } else {
        toast.warning(`⏰ Check-in atrasado (${result.lateMinutes} min). Streak reiniciado.`, {
          duration: 4000,
        });
      }
    },
    onError: (error) => {
      toast.error('Erro ao registrar check-in');
      logger.apiError("checkIn", error, "Attendance");
    },
  });
}

export function useCheckOut() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AttendanceRecord | null> => {
      if (!user?.id) throw new Error('User not authenticated');
      return attendanceService.checkOut(user.id);
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: attendanceKeys.all });
        toast.success('Check-out registrado com sucesso!');
      } else {
        toast.info('Nenhum check-in encontrado para hoje');
      }
    },
    onError: (error) => {
      toast.error('Erro ao registrar check-out');
      logger.apiError("checkOut", error, "Attendance");
    },
  });
}

export function useTeamAttendance(date?: string) {
  return useQuery({
    queryKey: attendanceKeys.team(date),
    queryFn: () => attendanceService.getTeamAttendance(date),
  });
}

export function useStreakLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: attendanceKeys.leaderboard(),
    queryFn: () => attendanceService.getStreakLeaderboard(limit),
  });
}
