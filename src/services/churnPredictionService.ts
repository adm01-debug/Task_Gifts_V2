import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export interface ChurnPrediction {
  userId: string;
  displayName: string;
  riskLevel: "high" | "medium";
  riskScore: number;
  riskIndicators: string[];
  interventionSuggestions: string[];
  metrics?: {
    daysInactive: number;
    streak: number;
    punctualityRate: number;
    recentXpGain: number;
  };
}

export interface ChurnPredictionSummary {
  totalAnalyzed: number;
  highRiskCount: number;
  mediumRiskCount: number;
  overallHealthScore: number;
}

export interface ChurnPredictionResponse {
  predictions: ChurnPrediction[];
  summary: ChurnPredictionSummary;
}

export const churnPredictionService = {
  async getPredictions(): Promise<ChurnPredictionResponse> {
    // Retry automático em falhas transitórias (rede/5xx); 429 nunca é repetido.
    const { data, error, requestId } = await invokeEdgeSafe<ChurnPredictionResponse>(
      "churn-prediction",
    );

    if (error) {
      logger.apiError(
        `Error fetching churn predictions (requestId=${requestId})`,
        new Error(error.message),
        "churnPredictionService",
      );
      throw new Error(error.message);
    }

    if (!data || typeof data !== "object") {
      throw new Error("Resposta inválida do serviço de previsão de churn.");
    }

    return data;
  }
};
