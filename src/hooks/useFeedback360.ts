import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackService, CycleInsert, FeedbackRequest } from "@/services/feedbackService";
import { useToast } from "@/hooks/use-toast";

export function useFeedback360() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cyclesQuery = useQuery({
    queryKey: ["feedback", "cycles"],
    queryFn: () => feedbackService.getActiveCycles(),
  });

  const pendingRequestsQuery = useQuery({
    queryKey: ["feedback", "pending"],
    queryFn: () => feedbackService.getMyPendingRequests(),
  });

  const receivedFeedbackQuery = useQuery({
    queryKey: ["feedback", "received"],
    queryFn: () => feedbackService.getReceivedFeedback(),
  });

  const createCycleMutation = useMutation({
    mutationFn: (cycle: CycleInsert) => feedbackService.createCycle(cycle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({ title: "Ciclo de feedback criado!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar ciclo", variant: "destructive" });
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: ({ cycleId, fromUserId, toUserId, relationship, dueDate }: { 
      cycleId: string; 
      fromUserId: string; 
      toUserId: string; 
      relationship: FeedbackRequest['relationship'];
      dueDate?: string;
    }) => feedbackService.createFeedbackRequest(cycleId, fromUserId, toUserId, relationship, dueDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({ title: "Solicitação de feedback enviada!" });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: ({ requestId, answers, strengths, improvements, overallRating, isAnonymous }: { 
      requestId: string; 
      answers: Record<string, string | number>;
      strengths?: string;
      improvements?: string;
      overallRating?: number;
      isAnonymous?: boolean;
    }) => feedbackService.submitFeedback(requestId, answers, strengths, improvements, overallRating, isAnonymous),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({ title: "Feedback enviado! +50 XP" });
    },
    onError: () => {
      toast({ title: "Erro ao enviar feedback", variant: "destructive" });
    },
  });

  const startCycleMutation = useMutation({
    mutationFn: (cycleId: string) => feedbackService.startCycle(cycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      toast({ title: "Ciclo iniciado!" });
    },
  });

  return {
    cycles: cyclesQuery.data ?? [],
    pendingRequests: pendingRequestsQuery.data ?? [],
    receivedFeedback: receivedFeedbackQuery.data ?? [],
    isLoading: cyclesQuery.isLoading,
    createCycle: createCycleMutation.mutate,
    createRequest: createRequestMutation.mutate,
    submitFeedback: submitFeedbackMutation.mutate,
    startCycle: startCycleMutation.mutate,
    isSubmitting: submitFeedbackMutation.isPending,
    getFeedbackSummary: feedbackService.getFeedbackSummary,
  };
}
