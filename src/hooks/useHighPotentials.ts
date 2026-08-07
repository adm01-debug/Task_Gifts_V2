import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { highPotentialService, HighPotentialScore } from "@/services/highPotentialService";

export function useHighPotentials(departmentId?: string) {
  return useQuery({
    queryKey: ["high-potentials", departmentId],
    queryFn: () => highPotentialService.identifyHighPotentials(departmentId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTopHighPotentials(limit = 10, departmentId?: string) {
  return useQuery({
    queryKey: ["high-potentials-top", limit, departmentId],
    queryFn: () => highPotentialService.getTopHighPotentials(limit, departmentId),
    staleTime: 10 * 60 * 1000,
  });
}

export function useHighPotentialsManual() {
  const [data, setData] = useState<HighPotentialScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const identify = async (departmentId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await highPotentialService.identifyHighPotentials(departmentId);
      setData(results);
      return results;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    identify,
  };
}
