import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { successionService, CriticalPosition, SuccessionPlan } from "@/services/successionService";

export function useCriticalPositions() {
  return useQuery({
    queryKey: ["critical-positions"],
    queryFn: () => successionService.getCriticalPositions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSuccessionPlan(positionId: string | null) {
  return useQuery({
    queryKey: ["succession-plan", positionId],
    queryFn: () => successionService.getSuccessionPlan(positionId!),
    enabled: !!positionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuccessionHealth() {
  return useQuery({
    queryKey: ["succession-health"],
    queryFn: () => successionService.getOverallSuccessionHealth(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSuccessionManual() {
  const [selectedPosition, setSelectedPosition] = useState<CriticalPosition | null>(null);
  const [plan, setPlan] = useState<SuccessionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPlan = async (positionId: string) => {
    setIsLoading(true);
    try {
      const result = await successionService.getSuccessionPlan(positionId);
      setPlan(result);
      setSelectedPosition(result.position);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setSelectedPosition(null);
    setPlan(null);
  };

  return {
    selectedPosition,
    plan,
    isLoading,
    loadPlan,
    clear,
  };
}
