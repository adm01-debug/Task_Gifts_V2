import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { moodTrackerService, MoodInsert } from "@/services/moodTrackerService";
import { useToast } from "@/hooks/use-toast";

export function useMoodTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const todayMoodQuery = useQuery({
    queryKey: ["mood", "today"],
    queryFn: () => moodTrackerService.getTodayMood(),
  });

  const historyQuery = useQuery({
    queryKey: ["mood", "history"],
    queryFn: () => moodTrackerService.getMyMoodHistory(30),
  });

  const averageMoodQuery = useQuery({
    queryKey: ["mood", "average"],
    queryFn: () => moodTrackerService.getAverageMood(7),
  });

  const teamStatsQuery = useQuery({
    queryKey: ["mood", "team-stats"],
    queryFn: () => moodTrackerService.getTeamMoodStats(undefined, 7),
  });

  const submitMoodMutation = useMutation({
    mutationFn: (entry: MoodInsert) => moodTrackerService.submitMood(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood"] });
      toast({ title: "Humor registrado! +10 XP" });
    },
    onError: () => {
      toast({ title: "Erro ao registrar humor", variant: "destructive" });
    },
  });

  return {
    todayMood: todayMoodQuery.data,
    moodHistory: historyQuery.data ?? [],
    averageMood: averageMoodQuery.data ?? 0,
    teamStats: teamStatsQuery.data ?? [],
    isLoading: todayMoodQuery.isLoading,
    submitMood: submitMoodMutation.mutate,
    isSubmitting: submitMoodMutation.isPending,
    hasRecordedToday: !!todayMoodQuery.data,
    getMoodEmoji: moodTrackerService.getMoodEmoji,
    getMoodColor: moodTrackerService.getMoodColor,
  };
}
