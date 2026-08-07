import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Flame,
  Info,
  Minus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
import { useRBAC } from "@/hooks/useRBAC";
import { useBossWinRateGoals } from "@/hooks/useBossWinRateGoals";
import { NO_DEPARTMENT } from "@/lib/bossDepartmentComparison";
import {
  buildBossExecutiveSummary,
  type BossExecutiveAlert,
  type ExecutiveAlertLevel,
} from "@/lib/bossExecutiveSummary";
import type { BossHistoryInput } from "@/lib/bossHistory";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { value: "30", label: "Período: 30 dias" },
  { value: "90", label: "Período: 90 dias" },
  { value: "180", label: "Período: 6 meses" },
] as const;

const LEVEL_ICON: Record<ExecutiveAlertLevel, React.ComponentType<{ className?: string }>> = {
  critical: Flame,
  warning: AlertTriangle,
  info: Info,
};

const LEVEL_STYLE: Record<ExecutiveAlertLevel, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "border-border/60 bg-muted/40 text-muted-foreground",
};

export interface BossExecutiveSummaryCardProps {
  battles: readonly BossHistoryInput[];
  className?: string;
}

/**
 * Painel executivo para a chefia: tendência do período, alertas acionáveis e
 * situação das metas por departamento em uma única leitura.
 *
 * Visível apenas para gestores e administradores — a leitura consolidada de
 * desempenho por área é informação de gestão, não de colaborador.
 */
export function BossExecutiveSummaryCard({ battles, className }: BossExecutiveSummaryCardProps) {
  const [days, setDays] = useState<string>("90");
  const { isAdmin, isManager } = useRBAC();
  const { data: departments } = useDepartments();
  const { config } = useBossWinRateGoals();

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const dep of departments || []) map.set(dep.id, dep.name);
    return map;
  }, [departments]);

  const summary = useMemo(
    () =>
      buildBossExecutiveSummary(battles, {
        days: Number(days),
        target: config.global?.target,
        tolerancePp: config.global?.tolerancePp,
        overrides: config.overrides,
      }),
    [battles, days, config.global?.target, config.global?.tolerancePp, config.overrides],
  );

  const departmentName = (id: string | null) => {
    if (!id || id === NO_DEPARTMENT) return "Geral";
    return nameById.get(id) ?? "Departamento";
  };

  if (!isAdmin && !isManager) return null;

  const DeltaIcon =
    summary.winRateDeltaPp === null || summary.winRateDeltaPp === 0
      ? Minus
      : summary.winRateDeltaPp > 0
        ? TrendingUp
        : TrendingDown;

  return (
    <Card className={cn("mb-4 border-border/60", className)}>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4" />
          Painel executivo
        </CardTitle>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="h-9 w-[170px]" aria-label="Período do painel executivo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi
            label="Aproveitamento"
            value={`${summary.winRatePct}%`}
            hint={
              summary.winRateDeltaPp === null
                ? "sem base anterior"
                : `${summary.winRateDeltaPp > 0 ? "+" : ""}${summary.winRateDeltaPp} p.p.`
            }
            icon={DeltaIcon}
          />
          <Kpi
            label="Batalhas no período"
            value={String(summary.battles)}
            hint={`${summary.previousBattles} no anterior`}
          />
          <Kpi
            label="Em andamento"
            value={String(summary.activeBattles)}
            hint={`${summary.awaitingSettlement} sem apuração`}
          />
          <Kpi
            label="Metas atingidas"
            value={`${summary.departmentsOnTrack}/${summary.departmentsTracked}`}
            hint={`${summary.departmentsDropping} em queda`}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Alertas do período
          </p>
          {summary.alerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Nenhum alerta acionável. Todos os departamentos dentro do esperado.
            </div>
          ) : (
            <ul className="space-y-2">
              {summary.alerts.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  departmentLabel={departmentName(alert.departmentId)}
                />
              ))}
            </ul>
          )}
        </div>

        {summary.rows.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Metas por departamento
            </p>
            <ul className="space-y-2">
              {summary.rows.map((row) => (
                <li
                  key={row.departmentId}
                  className="rounded-lg border border-border/60 p-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {departmentName(row.departmentId)}
                    </span>
                    <Badge
                      variant={
                        row.status === "on_track"
                          ? "default"
                          : row.status === "below_target"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {row.winRatePct}% · meta {row.targetPct}%
                    </Badge>
                  </div>
                  <Progress value={row.winRatePct} className="mt-2 h-1.5" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {row.battles} batalha(s) ·{" "}
                    {row.deltaPp === null
                      ? "sem base anterior"
                      : `${row.deltaPp > 0 ? "+" : ""}${row.deltaPp} p.p.`}
                    {row.gapToTargetPp > 0 && ` · faltam ${row.gapToTargetPp} p.p.`}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(summary.topDepartment || summary.bottomDepartment) && (
          <div className="grid gap-2 sm:grid-cols-2">
            {summary.topDepartment && (
              <p className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Destaque:</span>{" "}
                {departmentName(summary.topDepartment.departmentId)} com{" "}
                {summary.topDepartment.winRatePct}% de vitórias
              </p>
            )}
            {summary.bottomDepartment && (
              <p className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Atenção:</span>{" "}
                {departmentName(summary.bottomDepartment.departmentId)} com{" "}
                {summary.bottomDepartment.winRatePct}% de vitórias
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface KpiProps {
  label: string;
  value: string;
  hint: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function Kpi({ label, value, hint, icon: Icon }: KpiProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {hint}
      </p>
    </div>
  );
}

interface AlertRowProps {
  alert: BossExecutiveAlert;
  departmentLabel: string;
}

function AlertRow({ alert, departmentLabel }: AlertRowProps) {
  const Icon = LEVEL_ICON[alert.level];
  return (
    <li className={cn("flex items-start gap-2 rounded-lg border p-2.5", LEVEL_STYLE[alert.level])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium">
          {alert.title}
          {alert.departmentId && (
            <span className="font-normal"> · {departmentLabel}</span>
          )}
        </p>
        <p className="mt-0.5 text-[11px] opacity-90">{alert.detail}</p>
      </div>
    </li>
  );
}