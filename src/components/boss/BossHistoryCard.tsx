import { useCallback, useMemo, useState } from "react";
import { Download, History, Timer, Trophy, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDepartments } from "@/hooks/useDepartments";
import {
  formatDuration,
  listHistoryDepartments,
  summarizeBossHistory,
  type BossHistoryInput,
} from "@/lib/bossHistory";
import { bossHistoryFileName, buildBossHistoryCsv } from "@/lib/bossHistoryExport";
import { BossTrendChart } from "@/components/boss/BossTrendChart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALL = "__all__";

export interface BossHistoryCardProps {
  battles: readonly BossHistoryInput[];
  /** Quando informado, fixa o departamento e esconde o seletor. */
  departmentId?: string | null;
  limit?: number;
  className?: string;
}

/**
 * Retrospectiva das batalhas concluídas: taxa de vitória, HP destruído,
 * abate mais rápido e pendências de apuração — tudo derivado do motor puro.
 */
export function BossHistoryCard({
  battles,
  departmentId = null,
  limit = 8,
  className,
}: BossHistoryCardProps) {
  const [scope, setScope] = useState<string>(ALL);
  const { data: departments } = useDepartments();

  const options = useMemo(() => listHistoryDepartments(battles), [battles]);
  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const dep of departments || []) map.set(dep.id, dep.name);
    return map;
  }, [departments]);

  // Prop explícita vence o seletor; um escopo removido cai para "todos".
  const effectiveDepartment =
    departmentId ?? (scope !== ALL && options.some((o) => o.id === scope) ? scope : null);

  const summary = useMemo(
    () => summarizeBossHistory(battles, { departmentId: effectiveDepartment, limit }),
    [battles, effectiveDepartment, limit],
  );

  const totalConcluded = useMemo(() => summarizeBossHistory(battles).concluded, [battles]);

  const scopeLabel = effectiveDepartment ? nameById.get(effectiveDepartment) ?? null : null;

  const handleExport = useCallback(() => {
    try {
      const csv = buildBossHistoryCsv(battles, { departmentId: effectiveDepartment });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = bossHistoryFileName(scopeLabel);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Libera a memória apenas após o download ser iniciado pelo browser.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: unknown) {
      toast.error("Não foi possível exportar o histórico.");
    }
  }, [battles, effectiveDepartment, scopeLabel]);

  if (totalConcluded === 0) return null;

  const showFilter = !departmentId && options.length > 1;

  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 pb-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Hall da Fama
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
        {showFilter && (
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 w-full sm:w-[220px]" aria-label="Filtrar por departamento">
              <SelectValue placeholder="Todos os departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os departamentos</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {nameById.get(option.id) ?? "Departamento"} ({option.concluded})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          onClick={handleExport}
          disabled={summary.concluded === 0}
          aria-label="Exportar histórico em CSV"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar CSV</span>
        </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary.concluded === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma batalha concluída neste departamento ainda.
          </p>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat
            label="Taxa de vitória"
            value={`${Math.round(summary.winRate * 100)}%`}
            hint={`${summary.victories}V · ${summary.defeats}D`}
          />
          <MiniStat
            label="HP destruído (méd.)"
            value={`${Math.round(summary.avgHpDestroyedPct * 100)}%`}
            hint={`${summary.totalHpDestroyed.toLocaleString("pt-BR")} no total`}
          />
          <MiniStat
            label="Abate mais rápido"
            value={formatDuration(summary.fastestKillMs)}
            hint={`média ${formatDuration(summary.avgKillMs)}`}
          />
          <MiniStat
            label="Melhor sequência"
            value={`${summary.longestVictoryStreak}`}
            hint={`atual: ${summary.currentVictoryStreak}`}
          />
        </div>

        {summary.awaitingSettlement > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {summary.awaitingSettlement} vitória(s) ainda sem apuração — as recompensas só são
              creditadas depois de apurar a batalha.
            </span>
          </div>
        )}

        <ul className="divide-y divide-border/60">
          {summary.rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  {row.killDurationMs !== null
                    ? `abatido em ${formatDuration(row.killDurationMs)}`
                    : row.concludedAt
                      ? new Date(row.concludedAt).toLocaleDateString("pt-BR")
                      : "sem data"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-xs text-muted-foreground">
                  {Math.round(row.hpDestroyedPct * 100)}% HP
                </span>
                <Badge variant={row.victory ? "default" : "outline"} className="gap-1">
                  {row.victory && <Trophy className="h-3 w-3" />}
                  {row.victory ? (row.settled ? "Apurado" : "Vitória") : "Sobreviveu"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
        </>
        )}
      </CardContent>
    </Card>
  );
}

interface MiniStatProps {
  label: string;
  value: string;
  hint?: string;
}

function MiniStat({ label, value, hint }: MiniStatProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}