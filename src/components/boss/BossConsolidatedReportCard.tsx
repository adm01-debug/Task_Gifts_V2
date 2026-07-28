import { useCallback, useMemo, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { formatDuration, type BossHistoryInput } from "@/lib/bossHistory";
import { downloadCSV } from "@/lib/csvExport";
import {
  GOAL_STATUS_LABEL,
  buildBossReport,
  buildBossReportCsv,
  bossReportFileName,
  pct,
  resolveDepartmentName,
} from "@/lib/bossReport";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "180", label: "Últimos 6 meses" },
  { value: "365", label: "Últimos 12 meses" },
  { value: "0", label: "Todo o histórico" },
] as const;

const TARGETS = ["50", "60", "70", "80"] as const;
const ALL = "__all__";

export interface BossConsolidatedReportCardProps {
  battles: readonly BossHistoryInput[];
  className?: string;
}

/**
 * Relatório único com Hall da Fama, tendência, comparativo e metas — todos
 * sob o MESMO conjunto de filtros, exportável em CSV e PDF.
 */
export function BossConsolidatedReportCard({
  battles,
  className,
}: BossConsolidatedReportCardProps) {
  const [department, setDepartment] = useState<string>(ALL);
  const [window, setWindow] = useState<string>("90");
  const [target, setTarget] = useState<string>("60");
  const [exportingPdf, setExportingPdf] = useState(false);
  const { data: departments } = useDepartments();

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const dep of departments || []) map.set(dep.id, dep.name);
    return map;
  }, [departments]);

  const report = useMemo(
    () =>
      buildBossReport(
        battles,
        {
          departmentId: department === ALL ? null : department,
          days: Number(window),
          target: Number(target) / 100,
        },
        nameById,
      ),
    [battles, department, window, target, nameById],
  );

  const handleCsv = useCallback(() => {
    try {
      const csv = buildBossReportCsv(report, nameById);
      downloadCSV(bossReportFileName(report.meta, "csv"), csv.replace(/^\uFEFF/, ""));
      toast.success("Relatório CSV exportado");
    } catch {
      toast.error("Não foi possível exportar o CSV");
    }
  }, [report, nameById]);

  const handlePdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      const { exportBossReportPdf } = await import("@/lib/bossReportPdf");
      await exportBossReportPdf(report, nameById);
      toast.success("Relatório PDF exportado");
    } catch {
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setExportingPdf(false);
    }
  }, [report, nameById]);

  const { meta, history, goals, comparison } = report;

  return (
    <Card className={cn("mt-4 border-border/60 bg-card/70 backdrop-blur", className)}>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Relatório consolidado
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-9 w-[190px]" aria-label="Departamento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toda a empresa</SelectItem>
              {(departments || []).map((dep) => (
                <SelectItem key={dep.id} value={dep.id}>
                  {dep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={window} onValueChange={setWindow}>
            <SelectTrigger className="h-9 w-[170px]" aria-label="Janela">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-9 w-[130px]" aria-label="Meta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARGETS.map((t) => (
                <SelectItem key={t} value={t}>
                  Meta {t}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleCsv} disabled={history.concluded === 0}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" onClick={handlePdf} disabled={history.concluded === 0 || exportingPdf}>
            {exportingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.concluded === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma batalha concluída neste recorte. Ajuste o departamento ou a janela.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Tile label="Batalhas" value={String(history.concluded)} />
              <Tile label="Taxa de vitória" value={`${pct(history.winRate)}%`} />
              <Tile label="Abate médio" value={formatDuration(history.avgKillMs)} />
              <Tile label="Abaixo da meta" value={String(goals.belowTarget)} />
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">Seções incluídas</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>1. Resumo do Hall da Fama — {history.concluded} batalha(s)</li>
                <li>2. Tendência mensal — {report.trend.points.length} mês(es)</li>
                <li>3. Comparativo entre departamentos — {comparison.rows.length} área(s)</li>
                <li>4. Metas de aproveitamento — meta de {pct(meta.target)}%</li>
                <li>5. Detalhamento das batalhas concluídas</li>
              </ul>
            </div>

            {goals.rows.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {goals.rows.slice(0, 6).map((row) => (
                  <Badge key={row.departmentId} variant="outline" className="gap-1">
                    {resolveDepartmentName(row.departmentId, nameById)} ·{" "}
                    {GOAL_STATUS_LABEL[row.status]}
                  </Badge>
                ))}
              </div>
            )}

            {meta.excludedUndated > 0 && (
              <p className="text-xs text-muted-foreground">
                {meta.excludedUndated} batalha(s) concluída(s) sem data confiável ficaram fora do
                recorte por janela.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}