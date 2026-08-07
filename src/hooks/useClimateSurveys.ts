import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { climateSurveyService, ClimateSurvey, ClimateSurveyQuestion, ClimatePillarScore } from "@/services/climateSurveyService";
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

export function useSubmitSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, userId, answers }: {
      surveyId: string;
      userId: string;
      answers: { questionId: string; score?: number; textAnswer?: string }[];
    }) => climateSurveyService.submitResponse(surveyId, userId, answers),
    onSuccess: (_, { surveyId }) => {
      queryClient.invalidateQueries({ queryKey: ['climate-survey', surveyId] });
      queryClient.invalidateQueries({ queryKey: ['pillar-scores', surveyId] });
      toast.success('Resposta enviada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao enviar resposta');
    },
  });
}
