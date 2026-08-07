import { useQuery } from "@tanstack/react-query";
import { churnPredictionService, ChurnPredictionResponse } from "@/services/churnPredictionService";

export function useChurnPrediction() {
  const { data, isLoading, error, refetch } = useQuery<ChurnPredictionResponse>({
    queryKey: ['churn-prediction'],
    queryFn: () => churnPredictionService.getPredictions(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });

  return {
    predictions: data?.predictions || [],
    summary: data?.summary,
    isLoading,
    error,
    refetch,
  };
}
