import { useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeSafe } from "@/lib/requestId";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

interface CompetencyAlert {
  userId: string;
  gaps: string[];
  notificationsCreated: number;
}

interface CompetencyAlertResponse {
  success: boolean;
  analyzed: number;
  results: CompetencyAlert[];
}

export function useCompetencyAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const triggerAnalysis = useMutation({
    mutationFn: async (userId?: string) => {
      const { data, error, requestId } = await invokeEdgeSafe<CompetencyAlertResponse>(
        'competency-alerts',
        { body: { userId: userId || user?.id } }
      );

      if (error) throw new Error(`${error.message} (requestId=${requestId})`);
      return data;
    },
    onSuccess: (data) => {
      if (data?.results?.[0]?.notificationsCreated && data.results[0].notificationsCreated > 0) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    },
    onError: (error: Error) => {
      logger.apiError("Competency alerts error", error, "useCompetencyAlerts");
    },
  });

  const triggerBatchAnalysis = useMutation({
    mutationFn: async () => {
      const { data, error, requestId } = await invokeEdgeSafe<CompetencyAlertResponse>(
        'competency-alerts',
        { body: { checkAllUsers: true } }
      );

      if (error) throw new Error(`${error.message} (requestId=${requestId})`);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        const totalNotifications = data.results.reduce(
          (acc, r) => acc + r.notificationsCreated, 
          0
        );
        if (totalNotifications > 0) {
          toast.success(`${totalNotifications} alertas de competência enviados`);
        }
      }
    },
    onError: (error: Error) => {
      logger.apiError("Batch competency alerts error", error, "useCompetencyAlerts");
      toast.error('Erro ao analisar competências');
    },
  });

  // Auto-trigger analysis when user logs in (once per session)
  useEffect(() => {
    if (!user?.id) return;

    const sessionKey = `competency_analysis_${user.id}`;
    const lastAnalysis = sessionStorage.getItem(sessionKey);
    const now = Date.now();

    // Only trigger once per session (or after 4 hours)
    if (!lastAnalysis || now - parseInt(lastAnalysis) > 4 * 60 * 60 * 1000) {
      // Delay to not block initial load
      const timeout = setTimeout(() => {
        triggerAnalysis.mutate(user.id);
        sessionStorage.setItem(sessionKey, now.toString());
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [user?.id]);

  return {
    triggerAnalysis: useCallback((userId?: string) => triggerAnalysis.mutate(userId), []),
    triggerBatchAnalysis: useCallback(() => triggerBatchAnalysis.mutate(), []),
    isAnalyzing: triggerAnalysis.isPending,
    isBatchAnalyzing: triggerBatchAnalysis.isPending,
  };
}
