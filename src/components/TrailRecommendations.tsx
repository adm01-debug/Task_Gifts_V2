import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, Target, TrendingUp, ChevronRight, RefreshCw, Lightbulb, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";
import { describeEdgeError } from "@/lib/edgeErrors";

interface TrailRecommendation {
  trailId: string;
  title: string;
  reason: string;
  priority: "alta" | "média" | "baixa";
  skillGap: string;
}

interface AnalysisResult {
  strengths: string[];
  gaps: string[];
  nextSteps: string;
}

interface RecommendationsResponse {
  recommendations: TrailRecommendation[];
  analysis: AnalysisResult;
}

const priorityConfig = {
  alta: { color: "text-red-500", bgColor: "bg-red-500/10", label: "Alta" },
  média: { color: "text-amber-500", bgColor: "bg-amber-500/10", label: "Média" },
  baixa: { color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Baixa" },
};

export function TrailRecommendations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    // Evita disparos concorrentes que estouram o rate limit da edge function.
    if (!user?.id || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("trail-recommendations", {
        body: { userId: user.id },
      });

      if (fnError) throw fnError;

      if (!data || typeof data !== "object") {
        throw new Error("Resposta inválida do serviço de recomendações.");
      }

      if (data.error) {
        throw new Error(String(data.error));
      }

      setRecommendations(data);
      toast.success("Recomendações geradas com sucesso!");
    } catch (err: unknown) {
      const { message } = await describeEdgeError(err);
      logger.apiError(
        "fetchRecommendations",
        err instanceof Error ? err : new Error(message),
        "TrailRecommendations",
      );
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isLoading]);

  if (!recommendations && !isLoading && !error) {
    return (
      <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
        <CardContent className="p-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Recomendações Inteligentes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nossa IA analisa seu perfil, cargo e gaps de competência para sugerir as melhores trilhas para você.
              </p>
            </div>
            <Button onClick={fetchRecommendations} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Gerar Recomendações
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-5 h-5 text-purple-500" />
            </motion.div>
            <CardTitle className="text-lg">Analisando seu perfil...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <h3 className="font-bold">Erro ao gerar recomendações</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchRecommendations} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analysis Card */}
      {recommendations?.analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-lg">Análise do Perfil</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchRecommendations}
                  className="gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.analysis.strengths.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pontos Fortes</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendations.analysis.strengths.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {recommendations.analysis.gaps.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gaps Identificados</p>
                  <div className="flex flex-wrap gap-1">
                    {recommendations.analysis.gaps.map((g, i) => (
                      <Badge key={i} variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-muted-foreground italic">
                💡 {recommendations.analysis.nextSteps}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recommendations List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Trilhas Recomendadas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {recommendations?.recommendations.map((rec, index) => {
              const priority = priorityConfig[rec.priority] || priorityConfig.média;
              return (
                <motion.div
                  key={rec.trailId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/trails/${rec.trailId}`)}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{rec.title}</h4>
                        <Badge className={`${priority.bgColor} ${priority.color} text-xs`}>
                          {priority.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{rec.reason}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-500">{rec.skillGap}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {(!recommendations?.recommendations || recommendations.recommendations.length === 0) && (
            <p className="text-center text-muted-foreground py-4">
              Nenhuma recomendação disponível. Complete algumas trilhas primeiro!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
