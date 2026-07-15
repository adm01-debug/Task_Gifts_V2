import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Save, ExternalLink, Search, Plus, Trash2, AlertTriangle, Sparkles, X, CircleDot, Flame, CheckCircle2, Clock, Pencil, Check, ArrowDownWideNarrow } from "lucide-react";
import { toast } from "sonner";

type Postmortem = {
  id: string;
  alert_id: string | null;
  alert_type: string | null;
  title: string;
  status: "draft" | "in_review" | "published";
  severity: string | null;
  incident_started_at: string | null;
  incident_resolved_at: string | null;
  duration_seconds: number | null;
  summary: string | null;
  root_cause: string | null;
  contributing_factors: string | null;
  timeline: string | null;
  action_items: string | null;
  lessons_learned: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type ActionItem = {
  id: string;
  postmortem_id: string;
  title: string;
  description: string | null;
  owner_label: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "done" | "cancelled";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<Postmortem["status"], string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  published: "Publicado",
};

type SeverityKey = "critical" | "high" | "medium" | "low";

const SEVERITY_META: Record<SeverityKey, { label: string; dot: string; badge: string; ring: string }> = {
  critical: {
    label: "Crítica",
    dot: "bg-destructive",
    badge: "border-destructive/50 text-destructive bg-destructive/10",
    ring: "border-l-destructive",
  },
  high: {
    label: "Alta",
    dot: "bg-orange-500",
    badge: "border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-500/10",
    ring: "border-l-orange-500",
  },
  medium: {
    label: "Média",
    dot: "bg-amber-500",
    badge: "border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10",
    ring: "border-l-amber-500",
  },
  low: {
    label: "Baixa",
    dot: "bg-emerald-500",
    badge: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10",
    ring: "border-l-emerald-500",
  },
};

function getSeverityMeta(sev: string | null) {
  if (!sev) return null;
  const key = sev.toLowerCase() as SeverityKey;
  return SEVERITY_META[key] ?? null;
}

const SEVERITY_ORDER: Record<SeverityKey, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function severityRank(sev: string | null): number {
  if (!sev) return 99;
  const key = sev.toLowerCase() as SeverityKey;
  return SEVERITY_ORDER[key] ?? 99;
}

function fmtDur(sec: number | null) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}min`;
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return m ? `${h}h ${m}min` : `${h}h`;
}

function fmtRel(fromISO: string | null, toISO: string | null): string | null {
  if (!fromISO || !toISO) return null;
  const diff = Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 1000);
  if (!Number.isFinite(diff) || diff < 0) return null;
  return `+${fmtDur(diff)}`;
}

type Milestone = {
  key: string;
  label: string;
  at: string | null;
  icon: typeof CircleDot;
  tone: "muted" | "warn" | "success" | "info";
  hint?: string | null;
};

function IncidentTimeline({
  draft,
  onResolveNow,
  resolving,
}: {
  draft: Postmortem;
  onResolveNow: () => void;
  resolving: boolean;
}) {
  const anchor = draft.incident_started_at ?? draft.created_at;
  const milestones: Milestone[] = [
    { key: "created", label: "Postmortem aberto", at: draft.created_at, icon: Pencil, tone: "muted" },
    { key: "started", label: "Início do incidente", at: draft.incident_started_at, icon: Flame, tone: "warn" },
    { key: "resolved", label: "Incidente resolvido", at: draft.incident_resolved_at, icon: CheckCircle2, tone: "success", hint: fmtRel(draft.incident_started_at, draft.incident_resolved_at) },
    { key: "updated", label: "Última atualização", at: draft.updated_at, icon: Clock, tone: "info", hint: fmtRel(anchor, draft.updated_at) },
  ];

  const toneClasses: Record<Milestone["tone"], string> = {
    muted: "bg-muted text-muted-foreground border-border",
    warn: "bg-orange-500/10 text-orange-600 border-orange-500/30 dark:text-orange-400",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
    info: "bg-primary/10 text-primary border-primary/30",
  };

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <CircleDot className="w-3.5 h-3.5" aria-hidden />
          Cronograma do incidente
        </div>
        {!draft.incident_resolved_at && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            onClick={onResolveNow}
            disabled={resolving}
            title="Marca incident_resolved_at = agora e recalcula a duração"
          >
            <Check className="w-3.5 h-3.5" aria-hidden />
            {resolving ? "Resolvendo…" : "Marcar como resolvido agora"}
          </Button>
        )}
      </div>
      <ol className="relative border-l border-border/60 pl-4 space-y-3" aria-label="Marcos do incidente">
        {milestones.map((m) => {
          const Icon = m.icon;
          const missing = !m.at;
          return (
            <li key={m.key} className="relative">
              <span
                className={`absolute -left-[22px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                  missing ? "bg-background text-muted-foreground/50 border-dashed" : toneClasses[m.tone]
                }`}
                aria-hidden
              >
                <Icon className="w-2.5 h-2.5" />
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={missing ? "text-muted-foreground/70" : "font-medium"}>{m.label}</span>
                <span className="font-mono text-muted-foreground">
                  {m.at ? new Date(m.at).toLocaleString("pt-BR") : "aguardando"}
                </span>
                {m.hint && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {m.hint}
                  </Badge>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const FILTERS_KEY = "postmortems:filters";

type PersistedFilters = {
  statusFilter: string;
  anomalyOnly: boolean;
  sortBySeverity: boolean;
  pendingOnly: boolean;
  noPlanOnly: boolean;
  overdueOnly: boolean;
};

function loadFilters(): PersistedFilters {
  if (typeof window === "undefined") return { statusFilter: "all", anomalyOnly: false, sortBySeverity: false, pendingOnly: false, noPlanOnly: false, overdueOnly: false };
  try {
    const raw = window.localStorage.getItem(FILTERS_KEY);
    if (!raw) return { statusFilter: "all", anomalyOnly: false, sortBySeverity: false, pendingOnly: false, noPlanOnly: false, overdueOnly: false };
    const parsed = JSON.parse(raw) as Partial<PersistedFilters>;
    return {
      statusFilter: typeof parsed.statusFilter === "string" ? parsed.statusFilter : "all",
      anomalyOnly: Boolean(parsed.anomalyOnly),
      sortBySeverity: Boolean(parsed.sortBySeverity),
      pendingOnly: Boolean(parsed.pendingOnly),
      noPlanOnly: Boolean(parsed.noPlanOnly),
      overdueOnly: Boolean(parsed.overdueOnly),
    };
  } catch {
    return { statusFilter: "all", anomalyOnly: false, sortBySeverity: false, pendingOnly: false, noPlanOnly: false, overdueOnly: false };
  }
}

export default function Postmortems() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const initialFilters = useRef<PersistedFilters>(loadFilters()).current;
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters.statusFilter);
  const [anomalyOnly, setAnomalyOnly] = useState(initialFilters.anomalyOnly);
  const [sortBySeverity, setSortBySeverity] = useState(initialFilters.sortBySeverity);
  const [pendingOnly, setPendingOnly] = useState(initialFilters.pendingOnly);
  const [noPlanOnly, setNoPlanOnly] = useState(initialFilters.noPlanOnly);
  const [overdueOnly, setOverdueOnly] = useState(initialFilters.overdueOnly);
  const [params, setParams] = useSearchParams();

  // Persist filter preferences so the investigator keeps context between sessions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ statusFilter, anomalyOnly, sortBySeverity, pendingOnly, noPlanOnly, overdueOnly } satisfies PersistedFilters),
      );
    } catch {
      /* storage cheio ou bloqueado — ignore silenciosamente */
    }
  }, [statusFilter, anomalyOnly, sortBySeverity, pendingOnly, noPlanOnly, overdueOnly]);

  const selectedId = params.get("id");
  const flash = params.get("flash") === "1";
  const sourceParam = params.get("source");

  // Atalho "/" foca a busca (ignora quando o usuário já está digitando em outro campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Deep-link: chegar via ?source=anomaly já aplica o filtro e limpa o param.
  useEffect(() => {
    if (sourceParam !== "anomaly") return;
    setAnomalyOnly(true);
    const next = new URLSearchParams(params);
    next.delete("source");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceParam]);
  const editorRef = useRef<HTMLDivElement>(null);
  const [flashActive, setFlashActive] = useState(false);

  // Handoff from Executive Monthly Report: when arriving with ?flash=1,
  // scroll the freshly-created postmortem into view and briefly highlight
  // it, then strip the flag from the URL so it does not re-trigger.
  useEffect(() => {
    if (!flash || !selectedId) return;
    setFlashActive(true);
    const t1 = window.setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    const t2 = window.setTimeout(() => setFlashActive(false), 2400);
    const next = new URLSearchParams(params);
    next.delete("flash");
    setParams(next, { replace: true });
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash, selectedId]);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["postmortems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postmortems")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Postmortem[];
    },
    refetchInterval: 60_000,
  });

  // Contagem de action items por postmortem (pendentes e total).
  // Uma única query agregada em JS evita N+1 na sidebar.
  const { data: actionCounts = { pending: {}, total: {}, overdue: {} } } = useQuery({
    queryKey: ["postmortem_actions_pending_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postmortem_actions")
        .select("postmortem_id,status,due_date");
      if (error) throw error;
      const pending: Record<string, number> = {};
      const total: Record<string, number> = {};
      const overdue: Record<string, number> = {};
      const today = new Date().toISOString().slice(0, 10);
      for (const row of (data ?? []) as { postmortem_id: string; status: string; due_date: string | null }[]) {
        total[row.postmortem_id] = (total[row.postmortem_id] ?? 0) + 1;
        if (row.status === "open" || row.status === "in_progress") {
          pending[row.postmortem_id] = (pending[row.postmortem_id] ?? 0) + 1;
          if (row.due_date && row.due_date < today) {
            overdue[row.postmortem_id] = (overdue[row.postmortem_id] ?? 0) + 1;
          }
        }
      }
      return { pending, total, overdue };
    },
    refetchInterval: 60_000,
  });
  const pendingByPostmortem = actionCounts.pending;
  const totalByPostmortem = actionCounts.total;
  const overdueByPostmortem = actionCounts.overdue;

  const filtered = useMemo(() => {
    const result = list.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (anomalyOnly && p.alert_type !== "executive_monthly_regression") return false;
      if (pendingOnly && !(pendingByPostmortem[p.id] > 0)) return false;
      if (noPlanOnly && !(p.status === "published" && (totalByPostmortem[p.id] ?? 0) === 0)) return false;
      if (overdueOnly && !((overdueByPostmortem[p.id] ?? 0) > 0)) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        return p.title.toLowerCase().includes(s) || (p.alert_type ?? "").toLowerCase().includes(s);
      }
      return true;
    });
    if (sortBySeverity) {
      return [...result].sort((a, b) => {
        const diff = severityRank(a.severity) - severityRank(b.severity);
        if (diff !== 0) return diff;
        const overdueDiff = (overdueByPostmortem[b.id] ?? 0) - (overdueByPostmortem[a.id] ?? 0);
        if (overdueDiff !== 0) return overdueDiff;
        const pendingDiff = (pendingByPostmortem[b.id] ?? 0) - (pendingByPostmortem[a.id] ?? 0);
        if (pendingDiff !== 0) return pendingDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return result;
  }, [list, search, statusFilter, anomalyOnly, sortBySeverity, pendingOnly, noPlanOnly, overdueOnly, pendingByPostmortem, totalByPostmortem, overdueByPostmortem]);

  const pendingCount = useMemo(
    () => list.filter((p) => (pendingByPostmortem[p.id] ?? 0) > 0).length,
    [list, pendingByPostmortem],
  );

  const noPlanCount = useMemo(
    () => list.filter((p) => p.status === "published" && (totalByPostmortem[p.id] ?? 0) === 0).length,
    [list, totalByPostmortem],
  );

  const overdueCountGlobal = useMemo(
    () => list.filter((p) => (overdueByPostmortem[p.id] ?? 0) > 0).length,
    [list, overdueByPostmortem],
  );

  const anomalyCount = useMemo(
    () => list.filter((p) => p.alert_type === "executive_monthly_regression").length,
    [list],
  );

  const selected = useMemo(() => list.find((p) => p.id === selectedId) ?? null, [list, selectedId]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setParams({ id: filtered[0].id }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length, selectedId]);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/incident-metrics" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Incident Metrics
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" /> Postmortems
          </h1>
          <p className="text-muted-foreground text-sm">
            Análises pós-incidente. Rascunhos são criados automaticamente ao resolver uma violação de SLA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Incidentes ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título/tipo…"
                className="pl-7 pr-10 h-9"
                aria-keyshortcuts="/"
              />
              <kbd
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded border border-border bg-muted/60 text-[10px] font-mono text-muted-foreground"
                aria-hidden
              >
                /
              </kbd>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="in_review">Em revisão</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setAnomalyOnly((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-xs transition-colors ${
                anomalyOnly
                  ? "bg-destructive/10 border-destructive/40 text-destructive"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
              aria-pressed={anomalyOnly}
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Criados a partir de anomalia
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-1.5 py-0 ${
                    anomalyOnly ? "border-destructive/50 text-destructive" : ""
                  }`}
                >
                  {anomalyCount}
                </Badge>
              </span>
              {anomalyOnly ? <X className="w-3.5 h-3.5" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setSortBySeverity((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-xs transition-colors ${
                sortBySeverity
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
              aria-pressed={sortBySeverity}
              title="Ordena Crítica → Alta → Média → Baixa → Sem severidade"
            >
              <span className="flex items-center gap-1.5">
                <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                Ordenar por severidade
              </span>
              {sortBySeverity ? <X className="w-3.5 h-3.5" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setPendingOnly((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-xs transition-colors ${
                pendingOnly
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
              aria-pressed={pendingOnly}
              title="Mostra apenas postmortems com action items em aberto ou em progresso"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Somente com pendências
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-1.5 py-0 ${
                    pendingOnly ? "border-amber-500/50 text-amber-600 dark:text-amber-400" : ""
                  }`}
                >
                  {pendingCount}
                </Badge>
              </span>
              {pendingOnly ? <X className="w-3.5 h-3.5" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setNoPlanOnly((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-xs transition-colors ${
                noPlanOnly
                  ? "bg-destructive/10 border-destructive/40 text-destructive"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
              aria-pressed={noPlanOnly}
              title="Mostra apenas postmortems publicados sem nenhum action item registrado"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Publicado sem plano
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-1.5 py-0 ${
                    noPlanOnly ? "border-destructive/50 text-destructive" : ""
                  }`}
                >
                  {noPlanCount}
                </Badge>
              </span>
              {noPlanOnly ? <X className="w-3.5 h-3.5" /> : null}
            </button>
            <button
              type="button"
              onClick={() => setOverdueOnly((v) => !v)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-xs transition-colors ${
                overdueOnly
                  ? "bg-destructive/10 border-destructive/40 text-destructive"
                  : "border-border hover:bg-muted/50 text-muted-foreground"
              }`}
              aria-pressed={overdueOnly}
              title="Mostra apenas postmortems com action items vencidos por SLA (due_date no passado)"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className={`w-3.5 h-3.5 ${overdueOnly ? "animate-pulse" : ""}`} />
                SLA estourado
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-1.5 py-0 ${
                    overdueOnly ? "border-destructive/50 text-destructive" : ""
                  }`}
                >
                  {overdueCountGlobal}
                </Badge>
              </span>
              {overdueOnly ? <X className="w-3.5 h-3.5" /> : null}
            </button>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-xs text-muted-foreground text-center py-6">Carregando…</div>
              ) : filtered.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">Nenhum postmortem.</div>
              ) : filtered.map((p) => {
                const sev = getSeverityMeta(p.severity);
                return (
                  <button
                    key={p.id}
                    onClick={() => setParams({ id: p.id })}
                    className={`w-full text-left p-2 rounded border border-l-4 transition-colors ${
                      sev ? sev.ring : "border-l-transparent"
                    } ${
                      selectedId === p.id
                        ? "bg-primary/10 border-primary/40"
                        : "hover:bg-muted/50 border-transparent"
                    }`}
                    title={sev ? `Severidade: ${sev.label}` : "Sem severidade"}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                          sev ? sev.dot : "bg-muted-foreground/30"
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium line-clamp-1">{p.title}</div>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1">
                          <Badge variant="outline" className="text-[10px] font-mono">{STATUS_LABEL[p.status]}</Badge>
                          {sev && (
                            <Badge variant="outline" className={`text-[10px] font-mono ${sev.badge}`}>
                              {sev.label}
                            </Badge>
                          )}
                          {p.alert_type && <Badge variant="outline" className="text-[10px] font-mono">{p.alert_type}</Badge>}
                          {(pendingByPostmortem[p.id] ?? 0) > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              title={`${pendingByPostmortem[p.id]} ação(ões) pendente(s)`}
                            >
                              {pendingByPostmortem[p.id]} pendente(s)
                            </Badge>
                          )}
                          {(overdueByPostmortem[p.id] ?? 0) > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono border-destructive/50 bg-destructive/10 text-destructive animate-pulse"
                              title={`${overdueByPostmortem[p.id]} ação(ões) vencida(s) por SLA`}
                            >
                              {overdueByPostmortem[p.id]} vencida(s)
                            </Badge>
                          )}
                          {p.status === "published" && (totalByPostmortem[p.id] ?? 0) === 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono border-destructive/50 bg-destructive/10 text-destructive"
                              title="Postmortem publicado sem nenhum action item registrado — investigação incompleta"
                            >
                              Sem plano
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {new Date(p.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selected ? (
          <div
            ref={editorRef}
            className={`space-y-4 rounded-lg transition-shadow duration-500 ${
              flashActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
            }`}
          >
            <Editor key={selected.id} initial={selected} onSaved={() => qc.invalidateQueries({ queryKey: ["postmortems"] })} />
            <ActionsPanel postmortemId={selected.id} />
          </div>
        ) : (
          <Card><CardContent className="p-8 text-sm text-muted-foreground text-center">Selecione um postmortem à esquerda.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function ActionsPanel({ postmortemId }: { postmortemId: string }) {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["postmortem_actions", postmortemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postmortem_actions")
        .select("*")
        .eq("postmortem_id", postmortemId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ActionItem[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["postmortem_actions", postmortemId] });
    qc.invalidateQueries({ queryKey: ["postmortem_actions_pending_counts"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("postmortem_actions").insert({
        postmortem_id: postmortemId,
        title: "Nova ação",
        priority: "medium",
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ação criada"); invalidate(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao criar"),
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<ActionItem> & { id: string }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("postmortem_actions").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao atualizar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("postmortem_actions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ação removida"); invalidate(); },
  });

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = items.filter(
    (i) => (i.status === "open" || i.status === "in_progress") && i.due_date && i.due_date < today
  ).length;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          Itens de ação ({items.length})
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-[10px] gap-1">
              <AlertTriangle className="w-3 h-3" /> {overdueCount} atrasado(s)
            </Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Nova ação
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="text-xs text-muted-foreground text-center py-4">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-6">
            Nenhuma ação registrada. Clique em "Nova ação" para começar.
          </div>
        ) : (
          items.map((it) => {
            const isOverdue = (it.status === "open" || it.status === "in_progress") && it.due_date && it.due_date < today;
            return (
              <div
                key={it.id}
                className={`p-3 rounded-lg border space-y-2 ${isOverdue ? "border-destructive/40 bg-destructive/5" : "border-border/60"}`}
              >
                <div className="flex items-start gap-2">
                  <Input
                    defaultValue={it.title}
                    onBlur={(e) => {
                      if (e.target.value !== it.title) update.mutate({ id: it.id, title: e.target.value });
                    }}
                    className="text-sm font-medium border-0 px-0 focus-visible:ring-0 h-auto"
                    placeholder="Título da ação"
                  />
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(it.id)} className="h-7 w-7 p-0">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
                <Textarea
                  defaultValue={it.description ?? ""}
                  onBlur={(e) => {
                    if ((e.target.value || null) !== it.description) update.mutate({ id: it.id, description: e.target.value || null });
                  }}
                  rows={2}
                  placeholder="Descrição / contexto…"
                  className="text-xs"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Responsável</Label>
                    <Input
                      defaultValue={it.owner_label ?? ""}
                      onBlur={(e) => {
                        if ((e.target.value || null) !== it.owner_label) update.mutate({ id: it.id, owner_label: e.target.value || null });
                      }}
                      placeholder="Nome/time"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Prazo</Label>
                    <Input
                      type="date"
                      defaultValue={it.due_date ?? ""}
                      onBlur={(e) => {
                        if ((e.target.value || null) !== it.due_date) update.mutate({ id: it.id, due_date: e.target.value || null });
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Prioridade</Label>
                    <Select
                      value={it.priority}
                      onValueChange={(v) => update.mutate({ id: it.id, priority: v as ActionItem["priority"] })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Status</Label>
                    <Select
                      value={it.status}
                      onValueChange={(v) => update.mutate({ id: it.id, status: v as ActionItem["status"] })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em progresso</SelectItem>
                        <SelectItem value="done">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function Editor({ initial, onSaved }: { initial: Postmortem; onSaved: () => void }) {
  const [draft, setDraft] = useState<Postmortem>(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const resolveNow = useMutation({
    mutationFn: async () => {
      const resolvedAt = new Date();
      // Fallback: se não houver incident_started_at, usa created_at como âncora.
      const startISO = draft.incident_started_at ?? draft.created_at;
      const startMs = new Date(startISO).getTime();
      const durationSec = Number.isFinite(startMs)
        ? Math.max(0, Math.round((resolvedAt.getTime() - startMs) / 1000))
        : null;
      const payload = {
        incident_resolved_at: resolvedAt.toISOString(),
        duration_seconds: durationSec,
      };
      const { data, error } = await supabase
        .from("postmortems")
        .update(payload)
        .eq("id", draft.id)
        .select("incident_resolved_at, duration_seconds, updated_at")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setDraft((d) => ({
        ...d,
        incident_resolved_at: data?.incident_resolved_at ?? d.incident_resolved_at,
        duration_seconds: data?.duration_seconds ?? d.duration_seconds,
        updated_at: data?.updated_at ?? d.updated_at,
      }));
      toast.success("Incidente marcado como resolvido");
      onSaved();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao resolver"),
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("postmortems")
        .update({
          title: draft.title,
          status: draft.status,
          summary: draft.summary,
          root_cause: draft.root_cause,
          contributing_factors: draft.contributing_factors,
          timeline: draft.timeline,
          action_items: draft.action_items,
          lessons_learned: draft.lessons_learned,
          severity: draft.severity,
        })
        .eq("id", draft.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Postmortem salvo"); onSaved(); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao salvar"),
  });

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="text-lg font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
          />
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            {draft.alert_type === "executive_monthly_regression" && (() => {
              const meta = (draft.metadata ?? {}) as Record<string, unknown>;
              const reportId = typeof meta.report_id === "string" ? meta.report_id : null;
              const period = typeof meta.period === "string" ? meta.period : null;
              return (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 border-primary/40 bg-primary/10 text-primary"
                >
                  <Sparkles className="w-3 h-3" aria-hidden />
                  Criado a partir de anomalia
                  {reportId && (
                    <Link
                      to={`/admin/executive-report?report=${reportId}`}
                      className="ml-1 inline-flex items-center gap-0.5 hover:underline"
                      title="Abrir relatório de origem"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {period ?? "relatório"}
                    </Link>
                  )}
                </Badge>
              );
            })()}
            {draft.alert_type && <Badge variant="outline" className="text-[10px] font-mono">{draft.alert_type}</Badge>}
            <span>Início: {draft.incident_started_at ? new Date(draft.incident_started_at).toLocaleString("pt-BR") : "—"}</span>
            <span>·</span>
            <span>Duração: {fmtDur(draft.duration_seconds)}</span>
            {draft.alert_id && (
              <Link to={`/admin/incident-metrics?type=${draft.alert_type ?? ""}`} className="inline-flex items-center gap-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> métricas
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={draft.severity ?? "unset"}
            onValueChange={(v) => setDraft({ ...draft, severity: v === "unset" ? null : v })}
          >
            <SelectTrigger className="h-9 w-[130px]" aria-label="Severidade">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unset">Sem severidade</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
            </SelectContent>
          </Select>
          <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as Postmortem["status"] })}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="in_review">Em revisão</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
            <Save className="w-3.5 h-3.5 mr-1" /> Salvar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <IncidentTimeline
          draft={draft}
          onResolveNow={() => resolveNow.mutate()}
          resolving={resolveNow.isPending}
        />
        {([
          ["summary", "Resumo executivo"],
          ["root_cause", "Causa raiz"],
          ["contributing_factors", "Fatores contribuintes"],
          ["timeline", "Timeline"],
          ["action_items", "Itens de ação"],
          ["lessons_learned", "Lições aprendidas"],
        ] as const).map(([field, label]) => (
          <div key={field}>
            <Label className="text-xs">{label}</Label>
            <Textarea
              value={draft[field] ?? ""}
              onChange={(e) => setDraft({ ...draft, [field]: e.target.value } as Postmortem)}
              rows={field === "timeline" || field === "summary" ? 6 : 4}
              className="font-mono text-sm mt-1"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}