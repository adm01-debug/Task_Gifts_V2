import { ArrowDown, ArrowUp, Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PILLAR_LABELS } from "@/services/climateSurveyService";
import type { FactorScore } from "@/services/engagementDiagnosticsService";
import { ScoreBadge } from "./ScoreBadge";

export interface FactorRankingProps {
  factors: FactorScore[];
  limit?: number;
  /** Quando informado, habilita a geração de plano de ação nos fatores críticos. */
  onGeneratePlan?: (factor: FactorScore) => void;
  /** Chave do fator cuja geração está em andamento. */
  generatingFactorKey?: string | null;
}

interface FactorListProps {
  items: FactorScore[];
  favorabilityBar: boolean;
  onGeneratePlan?: (factor: FactorScore) => void;
  generatingFactorKey?: string | null;
}

function FactorList({ items, favorabilityBar, onGeneratePlan, generatingFactorKey }: FactorListProps) {
  return (
    <ul className="space-y-3">
      {items.map((factor) => (
        <li key={factor.factor_id} className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{factor.factor_name}</p>
              <p className="text-xs text-muted-foreground">
                {PILLAR_LABELS[factor.pillar]?.pt ?? factor.pillar} · {factor.respondents} respondentes
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <ScoreBadge score={factor.score} showLabel={false} />
              {onGeneratePlan && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 min-h-[36px] px-2 text-xs"
                  disabled={generatingFactorKey === factor.factor_key}
                  onClick={() => onGeneratePlan(factor)}
                  aria-label={`Gerar plano de ação para ${factor.factor_name}`}
                >
                  {generatingFactorKey === factor.factor_key ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" aria-hidden />
                  )}
                  <span className="ml-1 hidden sm:inline">Gerar plano</span>
                </Button>
              )}
            </div>
          </div>
          <Progress
            value={
              favorabilityBar
                ? (factor.favorability ?? 0)
                : ((factor.score ?? 0) / 10) * 100
            }
            className="h-1.5"
          />
        </li>
      ))}
    </ul>
  );
}

/** Ranking dos fatores mais críticos e dos destaques positivos. */
export function FactorRanking({
  factors,
  limit = 5,
  onGeneratePlan,
  generatingFactorKey = null,
}: FactorRankingProps) {
  const ranked = [...factors].sort((a, b) => (a.score ?? 99) - (b.score ?? 99));
  const critical = ranked.slice(0, limit);
  const strengths = ranked.slice(-limit).reverse();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDown className="h-4 w-4 text-destructive" aria-hidden />
            Prioridades de ação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FactorList
            items={critical}
            favorabilityBar={false}
            onGeneratePlan={onGeneratePlan}
            generatingFactorKey={generatingFactorKey}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUp className="h-4 w-4 text-success" aria-hidden />
            Pontos fortes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FactorList items={strengths} favorabilityBar={false} />
        </CardContent>
      </Card>
    </div>
  );
}
