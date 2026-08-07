import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { oneOnOnePreparationService, OneOnOnePreparation } from "@/services/oneOnOnePreparationService";

export function useOneOnOnePreparation(employeeId: string | null) {
  return useQuery({
    queryKey: ["one-on-one-preparation", employeeId],
    queryFn: () => oneOnOnePreparationService.prepareOneOnOne(employeeId!),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOneOnOnePreparationManual() {
  const [preparation, setPreparation] = useState<OneOnOnePreparation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const prepare = async (employeeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await oneOnOnePreparationService.prepareOneOnOne(employeeId);
      setPreparation(result);
      return result;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setPreparation(null);
    setError(null);
  };

  return {
    preparation,
    isLoading,
    error,
    prepare,
    clear,
  };
}
