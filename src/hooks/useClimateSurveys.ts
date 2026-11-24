import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { climateSurveyService, ClimateSurvey, ClimateSurveyQuestion, ClimatePillarScore } from "@/services/climateSurveyService";
import { MIN_RESPONDENTS } from "@/services/engagementDiagnosticsService";
import { toast } from "sonner";

export function useClimateSurveys(status?: string) {
  return useQuery({
    queryKey: ['climate-surveys', status],
    queryFn: () => climateSurveyService.getSurveys(status),
  });
}

export function useClimateSurvey(id: string) {
  return useQuery({
    queryKey: ['climate-survey', id],
    queryFn: () => climateSurveyService.getSurveyById(id),
    enabled: !!id,
  });
}

export function useSurveyQuestions(surveyId: string) {
  return useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: () => climateSurveyService.getQuestions(surveyId),
    enabled: !!surveyId,
  });
}

export function usePillarScores(surveyId: string, departmentId?: string) {
  return useQuery({
    queryKey: ['pillar-scores', surveyId, departmentId],
    queryFn: () => climateSurveyService.getPillarScores(surveyId, departmentId),
    enabled: !!surveyId,
  });
}

export function useENPS(surveyId: string) {
  return useQuery({
    queryKey: ['enps', surveyId],
    queryFn: () => climateSurveyService.calculateENPS(surveyId),
    enabled: !!surveyId,
  });
}

export function useCreateClimateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (survey: Omit<ClimateSurvey, 'id' | 'created_at' | 'updated_at'>) =>
      climateSurveyService.createSurvey(survey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['climate-surveys'] });
      toast.success('Pesquisa de clima criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar pesquisa de clima');
    },
  });
}

export function useUpdateClimateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClimateSurvey> }) =>
      climateSurveyService.updateSurvey(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['climate-surveys'] });
      queryClient.invalidateQueries({ queryKey: ['climate-survey', id] });
      toast.success('Pesquisa atualizada!');
    },
    onError: () => {
      toast.error('Erro ao atualizar pesquisa');
    },
  });
}

export function useCreateSurveyQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (question: Omit<ClimateSurveyQuestion, 'id' | 'created_at'>) =>
      climateSurveyService.createQuestion(question),
    onSuccess: (_, { survey_id }) => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions', survey_id] });
      toast.success('Pergunta adicionada!');
    },
    onError: () => {
      toast.error('Erro ao adicionar pergunta');
    },
  });
}

export function useDeleteSurveyQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questionId }: { questionId: string; surveyId: string }) =>
      climateSurveyService.deleteQuestion(questionId),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ['survey-questions', surveyId] });
      toast.success('Pergunta removida!');
    },
    onError: () => {
      toast.error('Erro ao remover pergunta');
    },
  });
}

export function useSubmitSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, answers }: {
      surveyId: string;
      answers: { questionId: string; score?: number; textAnswer?: string }[];
    }) => climateSurveyService.submitResponse(surveyId, answers),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ['climate-survey', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['climate-answered'] });
      queryClient.invalidateQueries({ queryKey: ['pillar-scores', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['enps', surveyId] });
      toast.success('Resposta enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar resposta');
    },
  });
}

export function useMyAnsweredSurveyIds(userId?: string) {  return useQuery({
    queryKey: ['climate-answered', userId],
    queryFn: () => climateSurveyService.getMyAnsweredSurveyIds(userId as string),
    enabled: !!userId,
  });
}

export function useRecalculatePillarScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, minResponses }: { surveyId: string; minResponses?: number }) =>
      climateSurveyService.recalculatePillarScores(surveyId, minResponses),
    onSuccess: (updatedPillars, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ['pillar-scores', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['enps', surveyId] });
      if (updatedPillars === 0) {
        toast.info(`Ainda não há respostas suficientes para calcular os pilares (mínimo ${MIN_RESPONDENTS} por pilar).`);
      } else {
        toast.success(`Resultados atualizados: ${updatedPillars} pilar(es) calculado(s).`);
      }
    },
    onError: () => {
      toast.error('Erro ao recalcular resultados');
    },
  });
}
