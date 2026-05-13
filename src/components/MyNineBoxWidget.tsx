import { motion } from "framer-motion";
import { Grid3X3, TrendingUp, TrendingDown, Target, Star, AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLatestNineBoxEvaluation } from "@/hooks/useNineBox";
import { useAuth } from "@/hooks/useAuth";
import { BOX_LABELS } from "@/services/nineBoxService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BOX_COLORS: Record<number, string> = {
  1: "from-red-500/20 to-red-600/10 border-red-500/30",
  2: "from-orange-400/20 to-orange-500/10 border-orange-400/30",
  3: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
  4: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  5: "from-blue-400/20 to-blue-500/10 border-blue-400/30",
  6: "from-green-400/20 to-green-500/10 border-green-400/30",
  7: "from-purple-400/20 to-purple-500/10 border-purple-400/30",
  8: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  9: "from-amber-400/20 to-amber-500/10 border-amber-400/30",
};

const getBoxIcon = (box: number) => {
  switch (box) {
    case 9: return Star;
    case 8: return TrendingUp;
    case 7: return Sparkles;
    case 6: return TrendingUp;
    case 5: return Target;
    case 4: return AlertTriangle;
    case 3: return Target;
    case 2: return TrendingDown;
    case 1: return AlertTriangle;
    default: return Target;
  }
};

export function MyNineBoxWidget() {
  const { user } = useAuth();
  const { data: evaluation, isLoading } = useLatestNineBoxEvaluation(user?.id || "");

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-primary" />
            Minha Avaliação 9-Box
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Grid3X3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma avaliação disponível ainda</p>
            <p className="text-xs mt-1">Aguarde seu gestor realizar a avaliação</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const position = (evaluation as any).box_position as keyof typeof BOX_LABELS;
  const boxInfo = BOX_LABELS[position] || { name: "Desconhecido", description: "" };
  const Icon = getBoxIcon((evaluation as any).box_position);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Grid3X3 className="w-4 h-4 text-primary" />
              Minha Avaliação 9-Box
            </CardTitle>
            <Badge variant="outline">{evaluation.evaluation_period}</Badge>
          </div>
          <CardDescription>
            Atualizado em {format(new Date(evaluation.updated_at), "dd/MM/yyyy", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Box Position Highlight */}
          <div
            className={`p-4 rounded-xl bg-gradient-to-br border ${BOX_COLORS[(evaluation as any).box_position as keyof typeof BOX_COLORS] || ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-background/50">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{boxInfo.name}</h3>
                <p className="text-sm text-muted-foreground">{boxInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Desempenho</span>
                <span className="font-semibold">{(evaluation as any).performance_score}%</span>
              </div>
              <Progress value={evaluation.performance_score} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Potencial</span>
                <span className="font-semibold">{evaluation.potential_score}%</span>
              </div>
              <Progress value={evaluation.potential_score} className="h-2" />
            </div>
          </div>

          {/* Strengths */}
          {evaluation.strengths && evaluation.strengths.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Pontos Fortes</p>
              <div className="flex flex-wrap gap-1">
                {evaluation.strengths.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Development Areas */}
          {evaluation.development_areas && evaluation.development_areas.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Áreas de Desenvolvimento</p>
              <div className="flex flex-wrap gap-1">
                {evaluation.development_areas.map((s, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
