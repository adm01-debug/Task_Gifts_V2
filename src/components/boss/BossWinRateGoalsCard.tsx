import { useMemo, useState } from "react";
import { Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments } from "@/hooks/useDepartments";
import { NO_DEPARTMENT } from "@/lib/bossDepartmentComparison";
import {
  evaluateWinRateGoals,
  type DropSeverity,
  type GoalStatus,
} from "@/lib/bossWinRateGoals";
import type { BossHistoryInput } from "@/lib/bossHistory";
import { cn } from "@/lib/utils";

const TARGETS = [
  { value: "0.5", label: "Meta 50%" },
  { value: "0.6", label: "Meta 60%" },
  { value: "0.7", label: "Meta 70%" },
  { value: "0.8", label: "Meta 80%" },
] as const;

const STATUS_LABEL: Record<GoalStatus, string> = {
  no_data: "Sem dados",
  on_track: "Meta atingida",
  at_risk: "Em risco",
  below_target: "Abaixo da meta",
};

const STATUS_VARIANT: Record<GoalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  no_data: "outline",
  on_track: "default",
  at_risk: "secondary",
  below_target: "destructive",
};

const SEVERITY_LABEL: Record<DropSeverity, string> = {
  none: "",
  watch: "Queda leve",
  warning: "Queda relevante",
  critical: "Queda crítica",
};

export interface BossWinRateGoalsCardProps {
  battles: readonly BossHistoryInput[];
  className?: string;
}

/**
 * Acompanhamento de metas de aproveitamento por departamento, comparando a
 * janela atual com o bloco anterior contíguo para expor quedas.
 */
export function BossWinRateGoalsCard({ battles, className }: BossWinRateGoalsCardProps) {
  const [target, setTarget] = useState<string>("0.6");
  const [days, setDays] = useState<string>("90");
  const { data: departments } = useDepartments();

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const dep of departments || []) map.set(dep.id, dep.name);
    return map;
  }, [departments]);

  const result = useMemo(
    () =>
      evaluateWinRateGoals(battles, {
        target: Number(target),
        days: Number(days),
      }),
    [battles, target, days],
  );

  if (result.rows.length === 0) return null;

  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Metas de aproveitamento
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-9 w-[150px]" aria-label="Janela da meta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Janela 30 dias</SelectItem>
              <SelectItem value="90">Janela 90 dias</SelectItem>
              <SelectItem value="180">Janela 6 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-9 w-[130px]" aria-label="Meta de vitórias">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGETS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {result.belowTarget} departamento(s) abaixo da meta ·{" "}
          {result.dropping} com queda em relação ao período anterior
        </p>

        <ul className="space-y-3">
          {result.rows.map((row) => {
            const name =
              row.departmentId === NO_DEPARTMENT
                ? "Sem departamento"
                : nameById.get(row.departmentId) ?? "Departamento";
            const DeltaIcon =
              row.deltaPp === null || row.deltaPp === 0
                ? Minus
                : row.deltaPp > 0
                  ? TrendingUp
                  : TrendingDown;
            return (
              <li key={row.departmentId} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{name}</span>
                  <div className="flex items-center gap-2">
                    {row.severity !== "none" && (
                      <Badge variant="destructive" className="text-[10px]">
                        {SEVERITY_LABEL[row.severity]}
                      </Badge>
                    )}
                    <Badge variant={STATUS_VARIANT[row.status]} className="text-[10px]">
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </div>
                </div>
                <Progress value={Math.round(row.winRate * 100)} className="mt-2 h-2" />
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{Math.round(row.winRate * 100)}% de vitórias</span>
                  <span>{row.battles} batalha(s)</span>
                  <span className="flex items-center gap-1">
                    <DeltaIcon className="h-3 w-3" />
                    {row.deltaPp === null
                      ? "sem base anterior"
                      : `${row.deltaPp > 0 ? "+" : ""}${row.deltaPp} p.p.`}
                  </span>
                  {row.gapToTargetPp > 0 && <span>faltam {row.gapToTargetPp} p.p.</span>}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
