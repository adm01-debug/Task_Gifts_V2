import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { opinionsService, type OpinionScope } from "@/services/opinionsService";
import { logger } from "@/services/loggingService";
import type { OpinionDraft, OpinionStatus } from "@/lib/opinionChannel";

const STALE = 30 * 1000;
const KEY = "opinions";

function reportError(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  logger.error(fallback, message);
  toast.error(fallback, { description: message });
}

export function useOpinionFeed(scope: OpinionScope, status: OpinionStatus | null = null) {
  return useQuery({
    queryKey: [KEY, "feed", scope, status ?? "all"],
    queryFn: () => opinionsService.listFeed(scope, status),
    staleTime: STALE,
  });
}

export function useOpinionResponses(opinionId: string | null) {
  return useQuery({
    queryKey: [KEY, "responses", opinionId],
    queryFn: () => opinionsService.listResponses(opinionId as string),
    enabled: !!opinionId,
    staleTime: STALE,
  });
}

export function useCreateOpinion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: OpinionDraft) => opinionsService.create(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Manifestação enviada", {
        description: "O RH vai tratar dentro do prazo definido pela urgência.",
      });
    },
    onError: (err: unknown) => reportError(err, "Não foi possível enviar sua manifestação"),
  });
}

export function useToggleOpinionSupport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opinionId: string) => opinionsService.toggleSupport(opinionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, "feed"] });
    },
    onError: (err: unknown) => reportError(err, "Não foi possível registrar seu apoio"),
  });
}

export function useRespondToOpinion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      opinionId: string;
      content: string;
      isInternal?: boolean;
      status?: OpinionStatus;
    }) => opinionsService.respond(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Resposta registrada");
    },
    onError: (err: unknown) => reportError(err, "Não foi possível registrar a resposta"),
  });
}

export function useSetOpinionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opinionId, status }: { opinionId: string; status: OpinionStatus }) =>
      opinionsService.setStatus(opinionId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Situação atualizada");
    },
    onError: (err: unknown) => reportError(err, "Não foi possível atualizar a situação"),
  });
}

export function useGenerateOpinionActionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opinionId: string) => opinionsService.generateActionPlan(opinionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      toast.success("Plano 5W2H criado", { description: "Acompanhe em Planos de Ação." });
    },
    onError: (err: unknown) => reportError(err, "Não foi possível gerar o plano de ação"),
  });
}