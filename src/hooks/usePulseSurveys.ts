import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pulseSurveysService, SurveyInsert } from "@/services/pulseSurveysService";
import { useToast } from "@/hooks/use-toast";

export function usePulseSurveys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const activeSurveysQuery = useQuery({
    queryKey: ["pulse-surveys", "active"],
    queryFn: () => pulseSurveysService.getActiveSurveys(),
  });

  const mySurveysQuery = useQuery({
    queryKey: ["pulse-surveys", "mine"],
    queryFn: () => pulseSurveysService.getMySurveys(),
  });

  const createSurveyMutation = useMutation({
    mutationFn: (survey: SurveyInsert) => pulseSurveysService.createSurvey(survey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-surveys"] });
      toast({ title: "Pesquisa criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar pesquisa", variant: "destructive" });
    },
  });

  const submitResponseMutation = useMutation({
    mutationFn: ({ surveyId, answers }: { surveyId: string; answers: Record<string, string | number> }) =>
      pulseSurveysService.submitResponse(surveyId, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-surveys"] });
      toast({ title: "Resposta enviada! +25 XP" });
    },
    onError: () => {
      toast({ title: "Erro ao enviar resposta", variant: "destructive" });
    },
  });

  const closeSurveyMutation = useMutation({
    mutationFn: (surveyId: string) => pulseSurveysService.closeSurvey(surveyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pulse-surveys"] });
      toast({ title: "Pesquisa encerrada" });
    },
  });

  return {
    activeSurveys: activeSurveysQuery.data ?? [],
    mySurveys: mySurveysQuery.data ?? [],
    isLoading: activeSurveysQuery.isLoading,
    createSurvey: createSurveyMutation.mutate,
    submitResponse: submitResponseMutation.mutate,
    closeSurvey: closeSurveyMutation.mutate,
    isSubmitting: submitResponseMutation.isPending,
  };
}
