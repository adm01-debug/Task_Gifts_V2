import { AlertTriangle, ShieldCheck, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { RiskLevelBadge } from "./RiskLevelBadge";
import {
  RISK_LEVEL_DEADLINE_DAYS,
  requiresActionPlan,
  type Nr1RiskRow,
} from "@/services/nr1RiskService";

export interface Nr1RiskMatrixProps {
  rows: Nr1RiskRow[];
  onTreatRisk?: (row: Nr1RiskRow) => void;
  className?: string;
}

/** Grau máximo teórico da matriz (probabilidade 10 x severidade 3). */
const MAX_GRADE = 30;

export function Nr1RiskMatrix({ rows, onTreatRisk, className }: Nr1RiskMatrixProps) {
  if (rows.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {rows.map((row) => {
        const grade = row.risk_grade ?? 0;
        const actionable = requiresActionPlan(row.risk_level);
        const deadline = RISK_LEVEL_DEADLINE_DAYS[row.risk_level];

        return (
          <Card key={row.category_id} className="overflow-hidden">
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {actionable ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    ) : (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
                    )}
                    <h3 className="truncate font-semibold">{row.category_name}</h3>
                  </div>
                  {row.description && (
                    <p className="text-sm text-muted-foreground">{row.description}</p>
                  )}
                  {row.legal_reference && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Scale className="h-3 w-3" aria-hidden />
                      {row.legal_reference}
                    </p>
                  )}
                </div>
                <RiskLevelBadge level={row.risk_level} className="shrink-0" />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Clima" value={row.score !== null ? row.score.toFixed(1) : "—"} />
                <Metric
                  label="Probabilidade"
                  value={row.probability !== null ? row.probability.toFixed(1) : "—"}
                />
                <Metric label="Severidade" value={`${row.severity_weight}x`} />
                <Metric label="Grau de risco" value={grade.toFixed(1)} />
              </div>

              <Progress
                value={Math.min((grade / MAX_GRADE) * 100, 100)}
                aria-label={`Grau de risco de ${row.category_name}`}
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {row.factors_evaluated} fator(es) avaliado(s) · {row.respondents} respondentes
                  {deadline ? ` · tratativa em até ${deadline} dias` : ""}
                </p>
                {actionable && onTreatRisk && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-11 sm:min-h-9"
                    onClick={() => onTreatRisk(row)}
                  >
                    Tratar risco
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
