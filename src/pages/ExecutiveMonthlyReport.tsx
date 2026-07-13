import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileBarChart2, RefreshCw, Download, ExternalLink, TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { MessageSquareText, Save, Pencil, X } from "lucide-react";
import { AlertTriangle, Settings2, RotateCcw, FilePlus2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip as ReTooltip, YAxis } from "recharts";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  commentary: string | null;
  commentary_updated_at: string | null;
  commentary_updated_by: string | null;
};

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmtPeriod = (y: number, m: number) => `${MONTH_NAMES[m - 1]}/${y}`;
const fmtMin = (n: number | null) => (n == null ? "—" : n < 60 ? `${n.toFixed(1)}min` : `${(n / 60).toFixed(1)}h`);
// CSV-safe: wrap in quotes and escape embedded quotes/newlines per RFC 4180.
const csvEscape = (s: string) => `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

export default function ExecutiveMonthlyReport() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [editingCommentary, setEditingCommentary] = useState(false);
  const [commentaryDraft, setCommentaryDraft] = useState("");

  // ── Anomaly thresholds (persisted per browser) ─────────────────────
  const DEFAULT_REL_PCT = 30;   // 30% MoM em métricas contáveis/duração
  const DEFAULT_PP = 15;        // 15pp em métricas percentuais
  const STORAGE_KEY = "exec-report:anomaly-thresholds:v1";
  const [relPct, setRelPct] = useState<number>(DEFAULT_REL_PCT);
  const [ppAbs, setPpAbs] = useState<number>(DEFAULT_PP);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { relPct?: number; ppAbs?: number };
      if (typeof parsed.relPct === "number" && parsed.relPct > 0 && parsed.relPct <= 500) setRelPct(parsed.relPct);
      if (typeof parsed.ppAbs === "number" && parsed.ppAbs > 0 && parsed.ppAbs <= 100) setPpAbs(parsed.ppAbs);
    } catch { /* ignore corrupted preference */ }
  }, []);
  const persistThresholds = (rel: number, pp: number) => {
    setRelPct(rel);
    setPpAbs(pp);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ relPct: rel, ppAbs: pp })); } catch { /* noop */ }
  };
  const resetThresholds = () => persistThresholds(DEFAULT_REL_PCT, DEFAULT_PP);

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

  // Deep-link: quando o Postmortem devolve o usuário via ?report=<id>,
  // selecionamos aquele mês automaticamente e removemos o param da URL.
  useEffect(() => {
    const reportParam = searchParams.get("report");
    if (!reportParam || reports.length === 0) return;
    const exists = reports.some((r) => r.id === reportParam);
    if (exists) {
      setSelectedId(reportParam);
      const next = new URLSearchParams(searchParams);
      next.delete("report");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports.length, searchParams]);

  const saveCommentary = useMutation({
    mutationFn: async (payload: { id: string; commentary: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const trimmed = payload.commentary.trim();
      const { error } = await supabase
        .from("executive_monthly_reports")
        .update({
          commentary: trimmed.length ? trimmed : null,
          commentary_updated_at: new Date().toISOString(),
          commentary_updated_by: uid,
        })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comentário salvo");
      setEditingCommentary(false);
      qc.invalidateQueries({ queryKey: ["executive_monthly_reports"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao salvar"),
  });

  // Previous period = report immediately before the selected one in chronological order.
  const previous = useMemo(() => {
    if (!selected) return null;
    const idx = reports.findIndex((r) => r.id === selected.id);
    // reports are ordered DESC, so the "previous month" is at idx + 1
    return idx >= 0 ? reports[idx + 1] ?? null : null;
  }, [reports, selected]);

  // Contagem de postmortems vinculados ao mês selecionado (via metadata.report_id),
  // permitindo enxergar rapidamente se aquele mês já foi investigado.
  const { data: linkedPostmortems = 0 } = useQuery({
    queryKey: ["executive_report_linked_postmortems", selected?.id],
    enabled: !!selected?.id,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("postmortems")
        .select("id", { count: "exact", head: true })
        .eq("alert_type", "executive_monthly_regression")
        .contains("metadata", { report_id: selected!.id });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Trailing 6-month window (oldest → newest) ending on the selected report.
  const trailing = useMemo(() => {
    if (!selected) return [];
    const idx = reports.findIndex((r) => r.id === selected.id);
    if (idx < 0) return [];
    return reports.slice(idx, idx + 6).slice().reverse();
  }, [reports, selected]);

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
      "SLA_breaches","Postmortems","Publicados","Acoes_total","Acoes_concluidas","Acoes_atrasadas","Comentario",
    ];
    const rows = reports.map((r) => [
      fmtPeriod(r.period_year, r.period_month), r.incidents_total, r.incidents_resolved,
      r.incidents_critical, r.incidents_high, r.mtta_minutes_avg ?? "", r.mttr_minutes_avg ?? "",
      r.mttr_minutes_p95 ?? "", r.sla_breaches, r.postmortems_created, r.postmortems_published,
      r.action_items_total, r.action_items_done, r.action_items_overdue,
      csvEscape(r.commentary ?? ""),
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

  // Helpers for MoM delta rendering.
  const prevResolutionRate = previous && previous.incidents_total > 0
    ? Math.round((previous.incidents_resolved / previous.incidents_total) * 100) : null;
  const prevActionCompletion = previous && previous.action_items_total > 0
    ? Math.round((previous.action_items_done / previous.action_items_total) * 100) : null;

  // ── Anomaly detection ──────────────────────────────────────────────
  // A KPI is flagged when its MoM change is significantly worse than last month.
  // - Countable/duration metrics (lowerIsBetter): relative regression ≥ 30%.
  // - Percentage metrics (unit "pp"): absolute drop ≥ 15pp in the "good" direction.
  // - Edge case: previous = 0 and current > 0 on a lowerIsBetter metric is always flagged.
  type Anomaly = { label: string; detail: string };
  const anomalies = useMemo<Anomaly[]>(() => {
    if (!previous || !selected) return [];
    const out: Anomaly[] = [];
    // Thresholds are user-adjustable and persisted in localStorage.
    const REL = Math.max(0, relPct) / 100;
    const PP = Math.max(0, ppAbs);

    const checkLower = (label: string, curr: number | null, prev: number | null, fmt: (n: number) => string) => {
      if (curr == null || prev == null) return;
      if (prev === 0) {
        if (curr > 0) out.push({ label, detail: `subiu de 0 para ${fmt(curr)}` });
        return;
      }
      const diff = (curr - prev) / prev;
      if (diff >= REL) {
        out.push({ label, detail: `${(diff * 100).toFixed(0)}% pior (${fmt(prev)} → ${fmt(curr)})` });
      }
    };
    const checkHigherPct = (label: string, curr: number | null, prev: number | null) => {
      if (curr == null || prev == null) return;
      const drop = prev - curr; // queda em pp é ruim
      if (drop >= PP) {
        out.push({ label, detail: `caiu ${drop}pp (${prev}% → ${curr}%)` });
      }
    };

    checkLower("Incidentes", selected.incidents_total, previous.incidents_total, (n) => n.toString());
    checkLower("MTTR médio", selected.mttr_minutes_avg, previous.mttr_minutes_avg, fmtMin);
    checkLower("MTTA médio", selected.mtta_minutes_avg, previous.mtta_minutes_avg, fmtMin);
    checkLower("SLA breaches", selected.sla_breaches, previous.sla_breaches, (n) => n.toString());
    checkLower("Ações atrasadas", selected.action_items_overdue, previous.action_items_overdue, (n) => n.toString());
    checkHigherPct("Resolvidos", resolutionRate, prevResolutionRate);
    checkHigherPct("Ações concluídas", actionCompletion, prevActionCompletion);
    return out;
  }, [previous, selected, resolutionRate, prevResolutionRate, actionCompletion, prevActionCompletion, relPct, ppAbs]);

  // ── Postmortem draft from anomalies ────────────────────────────────
  // Turns the alert list into an actionable investigation artifact,
  // pre-filling title/summary/action items so the executive → postmortem
  // handoff is one click instead of a manual copy-paste.
  const createPostmortem = useMutation({
    mutationFn: async () => {
      if (!selected || !previous || anomalies.length === 0) {
        throw new Error("Nada para investigar neste período.");
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const period = fmtPeriod(selected.period_year, selected.period_month);
      const prevPeriod = fmtPeriod(previous.period_year, previous.period_month);
      const bullets = anomalies.map((a) => `- **${a.label}:** ${a.detail}`).join("\n");
      const summary =
        `Regressão mensal detectada em ${anomalies.length} KPI(s) vs. ${prevPeriod} ` +
        `(limiares: ≥${relPct}% em métricas contáveis, ≥${ppAbs}pp em percentuais).\n\n${bullets}`;
      const actionItems = anomalies
        .map((a) => `- [ ] Investigar causa raiz de "${a.label}" (${a.detail})`)
        .join("\n");
      const { data, error } = await supabase
        .from("postmortems")
        .insert({
          title: `Regressão mensal — ${period}`,
          status: "draft",
          alert_type: "executive_monthly_regression",
          summary,
          action_items: actionItems,
          created_by: uid,
          metadata: {
            source: "executive_monthly_report",
            report_id: selected.id,
            period,
            previous_period: prevPeriod,
            thresholds: { rel_pct: relPct, pp_abs: ppAbs },
            anomalies,
          },
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Postmortem criado a partir dos alertas");
      navigate(`/admin/postmortems?id=${id}&flash=1`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao criar postmortem"),
  });

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
          <CardTitle className="text-sm flex items-center gap-2">
            Período
            {selected && linkedPostmortems > 0 && (
              <Link
                to="/admin/postmortems?source=anomaly"
                className="inline-flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Ver postmortems criados a partir deste mês"
              >
                <FileText className="w-3 h-3" aria-hidden />
                {linkedPostmortems} postmortem{linkedPostmortems > 1 ? "s" : ""} vinculado{linkedPostmortems > 1 ? "s" : ""}
                <ExternalLink className="w-2.5 h-2.5 opacity-70" aria-hidden />
              </Link>
            )}
          </CardTitle>
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
                 hint={`${selected.incidents_critical} críticos · ${selected.incidents_high} high`}
                 delta={buildDelta(selected.incidents_total, previous?.incidents_total, { lowerIsBetter: true })}
                 spark={trailing.map((r) => ({ p: fmtPeriod(r.period_year, r.period_month), v: r.incidents_total }))}
                 sparkLowerIsBetter />
            <Kpi label="Resolvidos" value={resolutionRate != null ? `${resolutionRate}%` : "—"}
                 hint={`${selected.incidents_resolved}/${selected.incidents_total}`}
                 tone={resolutionRate != null && resolutionRate < 80 ? "warn" : "ok"}
                 delta={buildDelta(resolutionRate, prevResolutionRate, { unit: "pp" })} />
            <Kpi label="MTTR médio" value={fmtMin(selected.mttr_minutes_avg)}
                 hint={`P95: ${fmtMin(selected.mttr_minutes_p95)}`}
                 delta={buildDelta(selected.mttr_minutes_avg, previous?.mttr_minutes_avg, { lowerIsBetter: true })}
                 spark={trailing.map((r) => ({ p: fmtPeriod(r.period_year, r.period_month), v: r.mttr_minutes_avg ?? 0 }))}
                 sparkLowerIsBetter />
            <Kpi label="MTTA médio" value={fmtMin(selected.mtta_minutes_avg)}
                 delta={buildDelta(selected.mtta_minutes_avg, previous?.mtta_minutes_avg, { lowerIsBetter: true })} />
            <Kpi label="SLA breaches" value={selected.sla_breaches.toString()}
                 tone={selected.sla_breaches > 0 ? "warn" : "ok"}
                 delta={buildDelta(selected.sla_breaches, previous?.sla_breaches, { lowerIsBetter: true })}
                 spark={trailing.map((r) => ({ p: fmtPeriod(r.period_year, r.period_month), v: r.sla_breaches }))}
                 sparkLowerIsBetter />
            <Kpi label="Postmortems" value={`${selected.postmortems_published}/${selected.postmortems_created}`}
                 hint="publicados/criados"
                 delta={buildDelta(selected.postmortems_published, previous?.postmortems_published)} />
            <Kpi label="Ações concluídas" value={actionCompletion != null ? `${actionCompletion}%` : "—"}
                 hint={`${selected.action_items_done}/${selected.action_items_total}`}
                 tone={actionCompletion != null && actionCompletion < 70 ? "warn" : "ok"}
                 delta={buildDelta(actionCompletion, prevActionCompletion, { unit: "pp" })} />
            <Kpi label="Ações atrasadas" value={selected.action_items_overdue.toString()}
                 tone={selected.action_items_overdue > 0 ? "warn" : "ok"}
                 delta={buildDelta(selected.action_items_overdue, previous?.action_items_overdue, { lowerIsBetter: true })}
                 spark={trailing.map((r) => ({ p: fmtPeriod(r.period_year, r.period_month), v: r.action_items_overdue }))}
                 sparkLowerIsBetter />
          </div>

          {previous && (
            <div className="text-xs text-muted-foreground -mt-2 flex items-center justify-between gap-2 flex-wrap">
              <span>Comparativo vs. {fmtPeriod(previous.period_year, previous.period_month)}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    aria-label="Ajustar limiares de anomalia"
                  >
                    <Settings2 className="w-3.5 h-3.5" aria-hidden />
                    Limiares de anomalia
                    <Badge variant="secondary" className="ml-1 font-mono text-[10px]">
                      {relPct}% · {ppAbs}pp
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Sensibilidade dos alertas MoM</h4>
                    <p className="text-xs text-muted-foreground">
                      Métricas são sinalizadas quando pioram além destes limites vs. o mês anterior.
                      Preferência salva neste navegador.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rel-pct" className="text-xs">
                      Métricas contáveis/duração (Incidentes, MTTR, MTTA, SLA, Ações atrasadas)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="rel-pct"
                        type="number"
                        min={1}
                        max={500}
                        step={5}
                        value={relPct}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v > 0 && v <= 500) persistThresholds(v, ppAbs);
                        }}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">% pior</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pp-abs" className="text-xs">
                      Métricas percentuais (% Resolvidos, % Ações concluídas)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pp-abs"
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={ppAbs}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v > 0 && v <= 100) persistThresholds(relPct, v);
                        }}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">pp de queda</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-[11px] text-muted-foreground">
                      Padrão: {DEFAULT_REL_PCT}% · {DEFAULT_PP}pp
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={resetThresholds}
                      disabled={relPct === DEFAULT_REL_PCT && ppAbs === DEFAULT_PP}
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden />
                      Restaurar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {anomalies.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5" role="alert" aria-live="polite">
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" aria-hidden />
                  🚨 Alertas do período
                  <Badge variant="destructive" className="ml-1">{anomalies.length}</Badge>
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1 border-destructive/40 hover:bg-destructive/10"
                  onClick={() => createPostmortem.mutate()}
                  disabled={createPostmortem.isPending}
                >
                  <FilePlus2 className="w-3.5 h-3.5" aria-hidden />
                  {createPostmortem.isPending ? "Criando…" : "Criar postmortem"}
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-2">
                  KPIs com regressão significativa vs. {fmtPeriod(previous!.period_year, previous!.period_month)}
                  {" "}(≥{relPct}% em métricas contáveis, ≥{ppAbs}pp em percentuais).
                </p>
                <ul className="space-y-1.5">
                  {anomalies.map((a) => (
                    <li key={a.label} className="text-sm flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" aria-hidden />
                      <span>
                        <strong className="font-semibold">{a.label}:</strong>{" "}
                        <span className="text-muted-foreground">{a.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-primary/30 bg-primary/[0.02]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-primary" />
                Comentário do mês
              </CardTitle>
              {!editingCommentary ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCommentaryDraft(selected.commentary ?? "");
                    setEditingCommentary(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  {selected.commentary ? "Editar" : "Adicionar"}
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCommentary(false)}
                    disabled={saveCommentary.isPending}
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveCommentary.mutate({ id: selected.id, commentary: commentaryDraft })}
                    disabled={saveCommentary.isPending || commentaryDraft.length > 4000}
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {saveCommentary.isPending ? "Salvando…" : "Salvar"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editingCommentary ? (
                <>
                  <Textarea
                    value={commentaryDraft}
                    onChange={(e) => setCommentaryDraft(e.target.value)}
                    placeholder="Narrativa executiva do mês: destaques, causas raiz recorrentes, decisões tomadas…"
                    rows={6}
                    maxLength={4000}
                    className="text-sm"
                  />
                  <div className="text-[11px] text-muted-foreground mt-1 text-right">
                    {commentaryDraft.length}/4000
                  </div>
                </>
              ) : selected.commentary ? (
                <>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.commentary}</p>
                  {selected.commentary_updated_at && (
                    <div className="text-[11px] text-muted-foreground mt-2">
                      Atualizado em {new Date(selected.commentary_updated_at).toLocaleString("pt-BR")}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum comentário registrado para este período.
                </p>
              )}
            </CardContent>
          </Card>

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

type DeltaInfo = { pct: number | null; direction: "up" | "down" | "flat"; better: boolean; unit: "%" | "pp" } | null;

function buildDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
  opts: { lowerIsBetter?: boolean; unit?: "%" | "pp" } = {}
): DeltaInfo {
  const { lowerIsBetter = false, unit = "%" } = opts;
  if (current == null || previous == null) return null;
  if (unit === "pp") {
    const diff = current - previous;
    const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
    const better = diff === 0 ? true : lowerIsBetter ? diff < 0 : diff > 0;
    return { pct: Math.abs(diff), direction, better, unit: "pp" };
  }
  if (previous === 0) {
    if (current === 0) return { pct: 0, direction: "flat", better: true, unit: "%" };
    return { pct: null, direction: current > 0 ? "up" : "down", better: lowerIsBetter ? current < 0 : current > 0, unit: "%" };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  const direction = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  const better = direction === "flat" ? true : lowerIsBetter ? direction === "down" : direction === "up";
  return { pct: Math.abs(pct), direction, better, unit: "%" };
}

function Kpi({ label, value, hint, tone = "neutral", delta, spark, sparkLowerIsBetter }: {
  label: string; value: string; hint?: string; tone?: "ok" | "warn" | "neutral"; delta?: DeltaInfo;
  spark?: Array<{ p: string; v: number }>; sparkLowerIsBetter?: boolean;
}) {
  const toneClass =
    tone === "warn" ? "border-destructive/40 bg-destructive/5"
    : tone === "ok" ? "border-emerald-500/30 bg-emerald-500/5"
    : "border-border/60";
  const DeltaIcon = delta?.direction === "up" ? TrendingUp
    : delta?.direction === "down" ? TrendingDown : Minus;
  const deltaColor = !delta ? "" : delta.better
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-destructive";
  // Sparkline color mirrors the trend of the last vs first point in the window.
  const sparkTrendUp = spark && spark.length >= 2 ? spark[spark.length - 1].v > spark[0].v : true;
  const sparkGood = sparkLowerIsBetter ? !sparkTrendUp : sparkTrendUp;
  const sparkStroke = spark && spark.length >= 2
    ? sparkGood ? "hsl(var(--primary))" : "hsl(var(--destructive))"
    : "hsl(var(--muted-foreground))";
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <div className="text-2xl font-semibold">{value}</div>
        {delta && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${deltaColor}`}
            title="Variação vs. mês anterior"
            aria-label={`Variação vs mês anterior: ${delta.direction === "flat" ? "estável" : delta.direction === "up" ? "aumento" : "queda"}`}
          >
            <DeltaIcon className="w-3 h-3" aria-hidden />
            {delta.pct == null ? "novo" : delta.direction === "flat" ? "estável" : `${delta.pct.toFixed(delta.unit === "pp" ? 0 : 1)}${delta.unit}`}
          </span>
        )}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      {spark && spark.length >= 2 && (
        <div className="h-8 mt-2 -mx-1" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spark} margin={{ top: 2, bottom: 2, left: 2, right: 2 }}>
              <YAxis hide domain={["auto", "auto"]} />
              <ReTooltip
                cursor={false}
                contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 6 }}
                labelFormatter={(l) => String(l)}
                formatter={(v: number) => [v, label]}
              />
              <Line type="monotone" dataKey="v" stroke={sparkStroke} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}