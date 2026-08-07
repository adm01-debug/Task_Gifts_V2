import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  auctionService,
  auctionAdminService,
  type CreateAuctionInput,
} from "@/services/auctionService";
import { useAuth } from "./useAuth";

export const auctionKeys = {
  all: ["auctions"] as const,
  list: () => [...auctionKeys.all, "list"] as const,
  myBids: () => [...auctionKeys.all, "myBids"] as const,
  summary: (id: string) => [...auctionKeys.all, "summary", id] as const,
  admin: () => [...auctionKeys.all, "admin"] as const,
  events: () => [...auctionKeys.all, "events"] as const,
};

export function useAuctions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: auctionKeys.list(),
    queryFn: () => auctionService.list(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useMyAuctionBids() {
  const { user } = useAuth();
  return useQuery({
    queryKey: auctionKeys.myBids(),
    queryFn: () => auctionService.myBids(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useAuctionSummary(auctionId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: auctionKeys.summary(auctionId ?? "none"),
    queryFn: () => auctionService.summary(auctionId as string),
    enabled: !!user && !!auctionId,
    staleTime: 15_000,
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      auctionId,
      amount,
      dedupeKey,
    }: {
      auctionId: string;
      amount: number;
      dedupeKey?: string;
    }) => auctionService.placeBid(auctionId, amount, dedupeKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auctionKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useAdminAuctions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: auctionKeys.admin(),
    queryFn: () => auctionAdminService.listAll(),
    enabled: !!user,
    staleTime: 20_000,
  });
}

export function useCloseAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => auctionAdminService.close(auctionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
}

export function useCreateAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAuctionInput) => auctionAdminService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
}

export function usePublishAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => auctionAdminService.publish(auctionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
}

export function useCancelAuction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auctionId: string) => auctionAdminService.cancel(auctionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
}

/** Trilha auditável — só retorna dados para admins (RLS). */
export function useAuctionAdminEvents(limit = 40) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...auctionKeys.events(), limit],
    queryFn: () => auctionAdminService.events(limit),
    enabled: !!user,
    staleTime: 15_000,
  });
}
