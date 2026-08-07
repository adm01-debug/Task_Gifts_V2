import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  Flame,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Users,
  Shield,
  Lightbulb,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useChurnPrediction } from "@/hooks/useChurnPrediction";
import { ChurnPrediction } from "@/services/churnPredictionService";

const RiskBadge = ({ level }: { level: "high" | "medium" }) => {
  const config = {
    high: {
      label: "Alto Risco",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: AlertTriangle,
    },
    medium: {
      label: "Médio Risco",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      icon: TrendingDown,
    },
  };

  const { label, className, icon: Icon } = config[level];

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
};

const PredictionCard = ({
  prediction,
  index,
}: {
  prediction: ChurnPrediction;
  index: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card
        className={`p-4 transition-all duration-300 ${
          prediction.riskLevel === "high"
            ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40"
            : "bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40"
        }`}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  prediction.riskLevel === "high"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {prediction.displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  {prediction.displayName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <RiskBadge level={prediction.riskLevel} />
                  <span className="text-xs text-muted-foreground">
                    Score: {prediction.riskScore}%
                  </span>
                </div>
              </div>
            </div>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Metrics Summary */}
          {prediction.metrics && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="text-center p-2 rounded-lg bg-background/50">
                <Clock className="w-4 h-4 mx-auto text-muted-foreground" />
                <p className="text-sm font-bold text-foreground mt-1">
                  {prediction.metrics.daysInactive}d
                </p>
                <p className="text-xs text-muted-foreground">Inativo</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <Flame className="w-4 h-4 mx-auto text-amber-400" />
                <p className="text-sm font-bold text-foreground mt-1">
                  {prediction.metrics.streak}
                </p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <Target className="w-4 h-4 mx-auto text-green-400" />
                <p className="text-sm font-bold text-foreground mt-1">
                  {prediction.metrics.punctualityRate}%
                </p>
                <p className="text-xs text-muted-foreground">Pontualidade</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50">
                <Sparkles className="w-4 h-4 mx-auto text-primary" />
                <p className="text-sm font-bold text-foreground mt-1">
                  {prediction.metrics.recentXpGain}
                </p>
                <p className="text-xs text-muted-foreground">XP 7d</p>
              </div>
            </div>
          )}

          <CollapsibleContent className="mt-4 space-y-4">
            {/* Risk Indicators */}
            <div>
              <h5 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Indicadores de Risco
              </h5>
              <ul className="space-y-1">
                {prediction.riskIndicators.map((indicator, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-0.5">•</span>
                    {indicator}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Intervention Suggestions */}
            <div>
              <h5 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Sugestões de Intervenção
              </h5>
              <ul className="space-y-1">
                {prediction.interventionSuggestions.map((suggestion, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-green-400 mt-0.5">→</span>
                    {suggestion}
                  </motion.li>
                ))}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export function ChurnPredictionPanel() {
  const { predictions, summary, isLoading, error, refetch } =
    useChurnPrediction();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const highRiskPredictions = predictions.filter((p) => p.riskLevel === "high");
  const mediumRiskPredictions = predictions.filter(
    (p) => p.riskLevel === "medium"
  );

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Predição de Churn IA
            </h2>
            <p className="text-sm text-muted-foreground">
              Colaboradores em risco de desengajamento
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <div className="p-3 rounded-lg bg-background/50 text-center">
            <Users className="w-5 h-5 mx-auto text-muted-foreground" />
            <p className="text-xl font-bold text-foreground mt-1">
              {summary.totalAnalyzed}
            </p>
            <p className="text-xs text-muted-foreground">Analisados</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <AlertTriangle className="w-5 h-5 mx-auto text-red-400" />
            <p className="text-xl font-bold text-red-400 mt-1">
              {summary.highRiskCount}
            </p>
            <p className="text-xs text-muted-foreground">Alto Risco</p>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
            <TrendingDown className="w-5 h-5 mx-auto text-yellow-400" />
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {summary.mediumRiskCount}
            </p>
            <p className="text-xs text-muted-foreground">Médio Risco</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <Shield className="w-5 h-5 mx-auto text-green-400" />
            <p className="text-xl font-bold text-green-400 mt-1">
              {summary.overallHealthScore}%
            </p>
            <p className="text-xs text-muted-foreground">Saúde Geral</p>
          </div>
        </motion.div>
      )}

      {/* Health Score Progress */}
      {summary && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Índice de Saúde da Equipe
            </span>
            <span className="text-sm font-medium text-foreground">
              {summary.overallHealthScore}%
            </span>
          </div>
          <Progress
            value={summary.overallHealthScore}
            className="h-2"
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Erro ao carregar predições. Tente novamente.
          </p>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      ) : predictions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <Shield className="w-12 h-12 mx-auto text-green-400 mb-4" />
          <p className="text-lg font-medium text-foreground">
            Nenhum colaborador em risco!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Todos os membros da equipe estão engajados.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* High Risk Section */}
          {highRiskPredictions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alto Risco ({highRiskPredictions.length})
              </h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {highRiskPredictions.map((prediction, index) => (
                    <PredictionCard
                      key={prediction.userId}
                      prediction={prediction}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Medium Risk Section */}
          {mediumRiskPredictions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Médio Risco ({mediumRiskPredictions.length})
              </h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {mediumRiskPredictions.map((prediction, index) => (
                    <PredictionCard
                      key={prediction.userId}
                      prediction={prediction}
                      index={index + highRiskPredictions.length}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
