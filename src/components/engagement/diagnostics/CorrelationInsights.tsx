import { Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PILLAR_LABELS } from "@/services/climateSurveyService";
import type { PillarCorrelation } from "@/services/engagementDiagnosticsService";

function strengthLabel(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 0.7) return "Forte";
  if (abs >= 0.4) return "Moderada";
  return "Fraca";
}

/** Mostra quais pilares se movem juntos — apoio para achar causa raiz. */
export function CorrelationInsights({ correlations }: { correlations: PillarCorrelation[] }) {
  const top = correlations.filter((c) => c.correlation !== null).slice(0, 6);

  if (top.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4 text-primary" aria-hidden />
          Pilares que caminham juntos
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Quanto maior a relação, maior a chance de que agir em um pilar mova o outro.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {top.map((item) => {
            const value = item.correlation as number;
            return (
              <li
                key={`${item.pillar_a}-${item.pillar_b}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  {PILLAR_LABELS[item.pillar_a]?.pt ?? item.pillar_a}
                  <span className="mx-1.5 text-muted-foreground">↔</span>
                  {PILLAR_LABELS[item.pillar_b]?.pt ?? item.pillar_b}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {strengthLabel(value)} · {value.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
