import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileBarChart2, RefreshCw, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Report = {
  id: string;
  period_year: number;
  period_month: number;
  incidents_total: number;
  incidents_resolved: number;
  incidents_critical: number;
  incidents_high: number;
  mtta_minutes_avg: number | null;
  mttr_minutes_avg: number | null;
  mttr_minutes_p95: number | null;
  sla_breaches: number;
  postmortems_created: number;
  postmortems_published: number;
  action_items_total: number;
  action_items_done: number;
  action_items_overdue: number;
  breakdown_by_type: Array<{ alert_type: string; total: number; resolved: number; mttr_minutes: number | null }>;
  generated_at: string;
};

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmtPeriod = (y: number, m: number) => `${MONTH_NAMES[m - 1]}/${y}`;
const fmtMin = (n: number | null) => (n == null ? "—" : n < 60 ? `${n.toFixed(1)}min` : `${(n / 60).toFixed(1)}h`);

export default function ExecutiveMonthlyReport() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["executive_monthly_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executive_monthly_reports")
        .select("*")
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false })
        .limit(36);
      if (error) throw error;
      return ((data ?? []) as unknown) as Report[];
    },
  });

  const selected = useMemo(
    () => reports.find((r) => r.id === selectedId) ?? reports[0] ?? null,
    [reports, selectedId]
  );

  const regenerate = useMutation({
    mutationFn: async (params: { year?: number; month?: number }) => {
      const args: { p_year?: number; p_month?: number } = {};
      if (params.year != null) args.p_year = params.year;
      if (params.month != null) args.p_month = params.month;
      const { data, error } = await supabase.rpc("generate_executive_monthly_report", args);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Relatório gerado");
      qc.invalidateQueries({ queryKey: ["executive_monthly_reports"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao gerar"),
  });

  const exportCSV = () => {
    if (reports.length === 0) return;
    const header = [
      "Periodo","Incidentes","Resolvidos","Criticos","High","MTTA_min","MTTR_min","MTTR_p95_min",
      "SLA_breaches","Postmortems","Publicados","Acoes_total","Acoes_concluidas","Acoes_atrasadas",
    ];
    const rows = reports.map((r) => [
      fmtPeriod(r.period_year, r.period_month), r.incidents_total, r.incidents_resolved,
      r.incidents_critical, r.incidents_high, r.mtta_minutes_avg ?? "", r.mttr_minutes_avg ?? "",
      r.mttr_minutes_p95 ?? "", r.sla_breaches, r.postmortems_created, r.postmortems_published,
      r.action_items_total, r.action_items_done, r.action_items_overdue,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `executive_reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const resolutionRate = selected && selected.incidents_total > 0
    ? Math.round((selected.incidents_resolved / selected.incidents_total) * 100)
    : null;
  const actionCompletion = selected && selected.action_items_total > 0
    ? Math.round((selected.action_items_done / selected.action_items_total) * 100)
    : null;

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/incident-metrics" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Incident Metrics
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-2">
            <FileBarChart2 className="w-7 h-7 text-primary" /> Relatório Executivo Mensal
          </h1>
          <p className="text-muted-foreground text-sm">
            Snapshot mensal consolidado de incidentes, SLA, postmortems e ações. Regerado automaticamente todo dia 1.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCSV()} disabled={reports.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1" /> Exportar CSV
          </Button>
          <Button size="sm" onClick={() => regenerate.mutate({})} disabled={regenerate.isPending}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${regenerate.isPending ? "animate-spin" : ""}`} />
            Gerar mês anterior
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Período</CardTitle>
          <Select
            value={selected?.id ?? ""}
            onValueChange={(v) => setSelectedId(v)}
            disabled={reports.length === 0}
          >
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue placeholder="Nenhum relatório" />
            </SelectTrigger>
            <SelectContent>
              {reports.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {fmtPeriod(r.period_year, r.period_month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground text-center py-12">Carregando…</div>
      ) : !selected ? (
        <Card><CardContent className="p-12 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Nenhum relatório gerado ainda.</p>
          <Button size="sm" onClick={() => regenerate.mutate({})} disabled={regenerate.isPending}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Gerar agora
          </Button>
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="Incidentes" value={selected.incidents_total.toString()}
                 hint={`${selected.incidents_critical} críticos · ${selected.incidents_high} high`} />
            <Kpi label="Resolvidos" value={resolutionRate != null ? `${resolutionRate}%` : "—"}
                 hint={`${selected.incidents_resolved}/${selected.incidents_total}`}
                 tone={resolutionRate != null && resolutionRate < 80 ? "warn" : "ok"} />
            <Kpi label="MTTR médio" value={fmtMin(selected.mttr_minutes_avg)}
                 hint={`P95: ${fmtMin(selected.mttr_minutes_p95)}`} />
            <Kpi label="MTTA médio" value={fmtMin(selected.mtta_minutes_avg)} />
            <Kpi label="SLA breaches" value={selected.sla_breaches.toString()}
                 tone={selected.sla_breaches > 0 ? "warn" : "ok"} />
            <Kpi label="Postmortems" value={`${selected.postmortems_published}/${selected.postmortems_created}`}
                 hint="publicados/criados" />
            <Kpi label="Ações concluídas" value={actionCompletion != null ? `${actionCompletion}%` : "—"}
                 hint={`${selected.action_items_done}/${selected.action_items_total}`}
                 tone={actionCompletion != null && actionCompletion < 70 ? "warn" : "ok"} />
            <Kpi label="Ações atrasadas" value={selected.action_items_overdue.toString()}
                 tone={selected.action_items_overdue > 0 ? "warn" : "ok"} />
          </div>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Detalhamento por tipo de alerta</CardTitle>
              <span className="text-xs text-muted-foreground">
                Gerado em {new Date(selected.generated_at).toLocaleString("pt-BR")}
              </span>
            </CardHeader>
            <CardContent>
              {selected.breakdown_by_type.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  Nenhum alerta neste período.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground text-left">
                        <th className="py-2 pr-3">Tipo</th>
                        <th className="py-2 pr-3 text-right">Total</th>
                        <th className="py-2 pr-3 text-right">Resolvidos</th>
                        <th className="py-2 pr-3 text-right">MTTR</th>
                        <th className="py-2 pr-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.breakdown_by_type.map((row) => (
                        <tr key={row.alert_type} className="border-b last:border-0">
                          <td className="py-2 pr-3 font-mono text-xs">{row.alert_type}</td>
                          <td className="py-2 pr-3 text-right">{row.total}</td>
                          <td className="py-2 pr-3 text-right">
                            <Badge variant="outline" className="text-[10px]">
                              {row.total > 0 ? Math.round((row.resolved / row.total) * 100) : 0}%
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-right">{fmtMin(row.mttr_minutes)}</td>
                          <td className="py-2 pr-3 text-right">
                            <Link
                              to={`/admin/incident-metrics?type=${encodeURIComponent(row.alert_type)}`}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" /> métricas
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint, tone = "neutral" }: {
  label: string; value: string; hint?: string; tone?: "ok" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "warn" ? "border-destructive/40 bg-destructive/5"
    : tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5"
    : "border-border/60";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}