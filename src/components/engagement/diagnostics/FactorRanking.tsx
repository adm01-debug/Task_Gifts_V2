import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PILLAR_LABELS } from "@/services/climateSurveyService";
import type { FactorScore } from "@/services/engagementDiagnosticsService";
import { ScoreBadge } from "./ScoreBadge";

export interface FactorRankingProps {
  factors: FactorScore[];
  limit?: number;
}

function FactorList({ items, favorabilityBar }: { items: FactorScore[]; favorabilityBar: boolean }) {
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
            <ScoreBadge score={factor.score} showLabel={false} />
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
export function FactorRanking({ factors, limit = 5 }: FactorRankingProps) {
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
          <FactorList items={critical} favorabilityBar={false} />
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
