import { useQuery } from "@tanstack/react-query";
import { pushHistoryService } from "@/services/pushHistoryService";

export function usePushHistory(subscriptionId?: string | null) {
  const logs = useQuery({
    queryKey: ["push-history", subscriptionId ?? "all"],
    queryFn: () => pushHistoryService.listMine({ subscriptionId, limit: 200 }),
    staleTime: 1000 * 30,
  });

  const devices = useQuery({
    queryKey: ["push-history", "devices"],
    queryFn: () => pushHistoryService.listMyDevices(),
    staleTime: 1000 * 60,
  });

  return {
    logs: logs.data ?? [],
    devices: devices.data ?? [],
    isLoading: logs.isLoading || devices.isLoading,
    refetch: () => {
      logs.refetch();
      devices.refetch();
    },
  };
}