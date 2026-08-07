import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enpsService, ENPSSurvey } from "@/services/enpsService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useENPSSurveys(status?: string) {
  return useQuery({
    queryKey: ["enps", "surveys", status],
    queryFn: () => enpsService.getSurveys(status),
  });
}

export function useENPSSurvey(surveyId: string) {
  return useQuery({
    queryKey: ["enps", "survey", surveyId],
    queryFn: () => enpsService.getSurvey(surveyId),
    enabled: !!surveyId,
  });
}

export function useENPSResponses(surveyId: string) {
  return useQuery({
    queryKey: ["enps", "responses", surveyId],
    queryFn: () => enpsService.getResponses(surveyId),
    enabled: !!surveyId,
  });
}

export function useENPSSurveyStats(surveyId: string) {
  return useQuery({
    queryKey: ["enps", "stats", surveyId],
    queryFn: () => enpsService.getSurveyStats(surveyId),
    enabled: !!surveyId,
  });
}

export function useActiveSurveyForUser() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["enps", "active", user?.id],
    queryFn: () => enpsService.getActiveSurveyForUser(user!.id),
    enabled: !!user?.id,
  });
}

export function useCreateENPSSurvey() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (survey: Omit<Parameters<typeof enpsService.createSurvey>[0], "created_by">) =>
      enpsService.createSurvey({
        ...survey,
        created_by: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enps"] });
      toast.success("Pesquisa eNPS criada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar pesquisa: ${error.message}`);
    },
  });
}

export function useUpdateENPSSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<ENPSSurvey> & { id: string }) =>
      enpsService.updateSurvey(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enps"] });
      toast.success("Pesquisa atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteENPSSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => enpsService.deleteSurvey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enps"] });
      toast.success("Pesquisa removida!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });
}

export function useSubmitENPSResponse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (response: { survey_id: string; score: number; follow_up_answer?: string }) =>
      enpsService.submitResponse({
        ...response,
        user_id: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enps"] });
      toast.success("Resposta enviada! Obrigado pelo feedback.");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });
}

export function useEngagementSnapshots(departmentId?: string, limit = 12) {
  return useQuery({
    queryKey: ["engagement", "snapshots", departmentId, limit],
    queryFn: () => enpsService.getEngagementSnapshots(departmentId, limit),
  });
}

export function useGenerateSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ departmentId, periodType }: { departmentId?: string; periodType?: string }) =>
      enpsService.generateSnapshot(departmentId, periodType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement"] });
      toast.success("Snapshot gerado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar snapshot: ${error.message}`);
    },
  });
}
