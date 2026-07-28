import { useEffect, useMemo, useState } from "react";
import { Target, TrendingDown, TrendingUp, Minus, Save, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useRBAC } from "@/hooks/useRBAC";
import {
  useBossWinRateGoals,
  useRemoveBossWinRateGoal,
  useSaveBossWinRateGoal,
} from "@/hooks/useBossWinRateGoals";
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
  const [hydrated, setHydrated] = useState(false);
  const { data: departments } = useDepartments();
  const { isAdmin, isManager } = useRBAC();
  const canManage = isAdmin || isManager;
  const { config, isLoading: goalsLoading } = useBossWinRateGoals();
  const saveGoal = useSaveBossWinRateGoal();
  const removeGoal = useRemoveBossWinRateGoal();

  // Hidrata os controles com o padrão global persistido apenas uma vez, para
  // não sobrescrever ajustes manuais do usuário durante a sessão.
  useEffect(() => {
    if (hydrated || goalsLoading) return;
    if (config.global) {
      setTarget(String(config.global.target));
      setDays(String(config.global.windowDays));
    }
    setHydrated(true);
  }, [config.global, goalsLoading, hydrated]);

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
        tolerancePp: config.global?.tolerancePp,
        overrides: config.overrides,
      }),
    [battles, target, days, config.global?.tolerancePp, config.overrides],
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
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              disabled={saveGoal.isPending}
              onClick={() =>
                saveGoal.mutate({
                  departmentId: null,
                  target: Number(target),
                  tolerancePp: config.global?.tolerancePp ?? 5,
                  windowDays: Number(days),
                })
              }
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Salvar padrão
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {result.belowTarget} departamento(s) abaixo da meta ·{" "}
          {result.dropping} com queda em relação ao período anterior
          {config.global ? " · padrão carregado do banco" : ""}
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
                  <span>meta {Math.round(row.target * 100)}%</span>
                  <span>{row.battles} batalha(s)</span>
                  <span className="flex items-center gap-1">
                    <DeltaIcon className="h-3 w-3" />
                    {row.deltaPp === null
                      ? "sem base anterior"
                      : `${row.deltaPp > 0 ? "+" : ""}${row.deltaPp} p.p.`}
                  </span>
                  {row.gapToTargetPp > 0 && <span>faltam {row.gapToTargetPp} p.p.</span>}
                </div>
                {canManage && row.departmentId !== NO_DEPARTMENT && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Select
                      value={row.hasOverride ? String(row.target) : "inherit"}
                      onValueChange={(value) => {
                        if (value === "inherit") {
                          removeGoal.mutate(row.departmentId);
                          return;
                        }
                        saveGoal.mutate({
                          departmentId: row.departmentId,
                          target: Number(value),
                          tolerancePp: config.global?.tolerancePp ?? 5,
                          windowDays: Number(days),
                        });
                      }}
                    >
                      <SelectTrigger
                        className="h-8 w-[170px] text-xs"
                        aria-label={`Meta específica de ${name}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inherit">Usar meta padrão</SelectItem>
                        {TARGETS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label} (próprio)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {row.hasOverride && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        disabled={removeGoal.isPending}
                        onClick={() => removeGoal.mutate(row.departmentId)}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Restaurar padrão
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
