import { useMemo, useState } from "react";
import { BarChart3, Medal } from "lucide-react";
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
import { formatDuration, type BossHistoryInput } from "@/lib/bossHistory";
import {
  compareDepartments,
  lastDaysWindow,
  NO_DEPARTMENT,
} from "@/lib/bossDepartmentComparison";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "180", label: "Últimos 6 meses" },
  { value: "365", label: "Últimos 12 meses" },
  { value: "0", label: "Todo o histórico" },
] as const;

export interface BossDepartmentComparisonCardProps {
  battles: readonly BossHistoryInput[];
  className?: string;
}

/**
 * Ranking de departamentos na mesma janela temporal, com aproveitamento
 * suavizado para não premiar amostras minúsculas.
 */
export function BossDepartmentComparisonCard({
  battles,
  className,
}: BossDepartmentComparisonCardProps) {
  const [window, setWindow] = useState<string>("90");
  const { data: departments } = useDepartments();

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const dep of departments || []) map.set(dep.id, dep.name);
    return map;
  }, [departments]);

  const result = useMemo(() => {
    const days = Number(window);
    const range = days > 0 ? lastDaysWindow(days) : {};
    return compareDepartments(battles, range);
  }, [battles, window]);

  if (result.rows.length < 2) return null;

  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Comparativo entre departamentos
        </CardTitle>
        <Select value={window} onValueChange={setWindow}>
          <SelectTrigger className="h-9 w-full sm:w-[190px]" aria-label="Período do comparativo">
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
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {result.totalBattles} batalha(s) concluída(s) · média geral{" "}
          {Math.round(result.globalWinRate * 100)}% de vitórias
          {result.excludedUndated > 0 &&
            ` · ${result.excludedUndated} sem data de encerramento (fora do comparativo)`}
        </p>

        <ul className="space-y-3">
          {result.rows.map((row) => {
            const name =
              row.departmentId === NO_DEPARTMENT
                ? "Sem departamento"
                : nameById.get(row.departmentId) ?? "Departamento";
            return (
              <li key={row.departmentId} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    {row.rank <= 3 && (
                      <Medal
                        className={cn(
                          "h-4 w-4 shrink-0",
                          row.rank === 1 && "text-primary",
                          row.rank > 1 && "text-muted-foreground",
                        )}
                      />
                    )}
                    <span className="truncate font-medium">{name}</span>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      #{row.rank}
                    </Badge>
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {Math.round(row.winRate * 100)}% · {row.victories}V/{row.defeats}D
                  </span>
                </div>
                <Progress value={Math.round(row.adjustedWinRate * 100)} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground">
                  {row.hpDestroyed.toLocaleString("pt-BR")} HP destruído · abate médio{" "}
                  {formatDuration(row.avgKillMs)}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
