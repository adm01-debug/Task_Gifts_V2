import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, ShieldAlert, Wrench, LifeBuoy, ClipboardList, ExternalLink, CheckCircle2, Loader2, Download, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRunbook, type RunbookStep } from "@/lib/runbooks";

const SEV_STYLE: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  warning: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

const PHASE_LABEL: Record<string, string> = {
  diagnose: "Diagnosticar",
  mitigate: "Mitigar",
  recover: "Recuperar",
  postmortem: "Post-mortem",
  note: "Nota",
};

const PHASE_COLOR: Record<string, string> = {
  diagnose: "bg-primary/15 text-primary border-primary/30",
  mitigate: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  recover: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  postmortem: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  note: "bg-muted text-muted-foreground border-border",
};

function StepList({
  steps,
  icon,
  title,
  phase,
  onLog,
  loggingKey,
  disabled,
}: {
  steps: RunbookStep[];
  icon: React.ReactNode;
  title: string;
  phase: "diagnose" | "mitigate" | "recover";
  onLog: (phase: string, idx: number, stepTitle: string) => void;
  loggingKey: string | null;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="border-l-2 border-primary/40 pl-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{i + 1}. {s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.detail}</div>
                  {s.cmd && (
                    <code className="mt-1 inline-block text-xs bg-muted rounded px-2 py-0.5 font-mono">{s.cmd}</code>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => onLog(phase, i + 1, s.title)}
                  className="shrink-0"
                >
                  {loggingKey === `${phase}:${i + 1}` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Registrar</>
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function Runbook() {
  const { type = "" } = useParams();
  const rb = getRunbook(type);
  const [params] = useSearchParams();
  const alertId = params.get("alert");
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [logging, setLogging] = useState<string | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<string>("all");

  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ["runbook-timeline", type, alertId],
    queryFn: async () => {
      let q = supabase
        .from("runbook_executions")
        .select("id, phase, step_index, step_title, notes, performed_by, created_at, alert_id")
        .order("created_at", { ascending: false })
        .limit(200);
      if (alertId) q = q.eq("alert_id", alertId);
      else q = q.eq("runbook_slug", type);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!rb,
    refetchInterval: 30_000,
  });

  const logStep = useMutation({
    mutationFn: async (args: { phase: string; stepIndex: number | null; stepTitle: string | null; notes: string | null }) => {
      const { data, error } = await supabase.rpc("log_runbook_step", {
        p_alert_id: alertId,
        p_runbook_slug: type,
        p_phase: args.phase,
        p_step_index: args.stepIndex,
        p_step_title: args.stepTitle,
        p_notes: args.notes,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["runbook-timeline", type, alertId] });
      toast.success("Etapa registrada na timeline");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Falha ao registrar");
    },
    onSettled: () => setLogging(null),
  });

  const handleLogStep = (phase: string, idx: number, stepTitle: string) => {
    setLogging(`${phase}:${idx}`);
    logStep.mutate({ phase, stepIndex: idx, stepTitle, notes: null });
  };

  const handleAddNote = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    setLogging("note");
    logStep.mutate({ phase: "note", stepIndex: null, stepTitle: null, notes: trimmed });
    setNote("");
  };

  const filtered = useMemo(
    () => (phaseFilter === "all" ? timeline : timeline.filter((t: any) => t.phase === phaseFilter)),
    [timeline, phaseFilter]
  );

  const exportCSV = () => {
    const rows = [["created_at", "phase", "step_index", "step_title", "notes", "alert_id"]];
    filtered.forEach((t: any) => {
      rows.push([
        new Date(t.created_at).toISOString(),
        t.phase,
        String(t.step_index ?? ""),
        (t.step_title ?? "").replace(/"/g, '""'),
        (t.notes ?? "").replace(/"/g, '""'),
        t.alert_id ?? "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `runbook-timeline-${type}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!rb) {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Link to="/admin/security-runbook" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Security Runbook
        </Link>
        <Card className="mt-4">
          <CardContent className="p-8 text-center space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground" />
            <div className="text-lg font-semibold">Runbook não encontrado</div>
            <div className="text-sm text-muted-foreground">Tipo <code>{type}</code> não possui playbook cadastrado ainda.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/security-runbook" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" /> {rb.title}
          </h1>
          <p className="text-muted-foreground text-sm max-w-3xl mt-1">{rb.summary}</p>
        </div>
        <Badge variant="outline" className={SEV_STYLE[rb.severity]}>{rb.severity.toUpperCase()}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Responsável</div>
          <div className="text-sm font-semibold">{rb.owner}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Impacto no SLO</div>
          <div className="text-sm font-semibold">{rb.sloImpact}</div>
        </CardContent></Card>
      </div>

      {alertId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 text-xs text-muted-foreground">
            Vinculado ao alerta <code className="text-foreground">{alertId.slice(0, 8)}…</code> — cada etapa registrada será anexada a este incidente.
          </CardContent>
        </Card>
      )}

      <StepList steps={rb.diagnose} icon={<ShieldAlert className="w-4 h-4 text-primary" />} title="1. Diagnosticar" phase="diagnose" onLog={handleLogStep} loggingKey={logging} disabled={logStep.isPending} />
      <StepList steps={rb.mitigate} icon={<Wrench className="w-4 h-4 text-orange-500" />} title="2. Mitigar" phase="mitigate" onLog={handleLogStep} loggingKey={logging} disabled={logStep.isPending} />
      <StepList steps={rb.recover} icon={<LifeBuoy className="w-4 h-4 text-emerald-500" />} title="3. Recuperar" phase="recover" onLog={handleLogStep} loggingKey={logging} disabled={logStep.isPending} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" /> 4. Post-mortem</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {rb.postmortem.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Timeline do incidente
            <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="h-8 w-[150px]"><Filter className="w-3.5 h-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fases</SelectItem>
                <SelectItem value="diagnose">Diagnosticar</SelectItem>
                <SelectItem value="mitigate">Mitigar</SelectItem>
                <SelectItem value="recover">Recuperar</SelectItem>
                <SelectItem value="postmortem">Post-mortem</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="w-3.5 h-3.5 mr-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anotação livre (contexto, hipótese, decisão tomada)…"
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleAddNote} disabled={!note.trim() || logStep.isPending} className="sm:self-end">
              {logging === "note" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Adicionar nota"}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-6">Carregando timeline…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Nenhuma etapa registrada ainda. Clique em <strong>Registrar</strong> nas etapas acima para começar a trilha auditável.
            </div>
          ) : (
            <ol className="relative border-l-2 border-border pl-4 space-y-3">
              {filtered.map((t: any) => (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-primary ring-2 ring-background" />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className={PHASE_COLOR[t.phase] ?? ""}>{PHASE_LABEL[t.phase] ?? t.phase}</Badge>
                    {t.step_index != null && (
                      <span className="text-muted-foreground">Etapa #{t.step_index}</span>
                    )}
                    <span className="text-muted-foreground">{new Date(t.created_at).toLocaleString()}</span>
                    {!alertId && t.alert_id && (
                      <code className="text-[10px] text-muted-foreground">alerta {t.alert_id.slice(0, 8)}…</code>
                    )}
                  </div>
                  {t.step_title && <div className="text-sm font-medium mt-0.5">{t.step_title}</div>}
                  {t.notes && <div className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{t.notes}</div>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Links relacionados</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {rb.relatedLinks.map((l) => (
            <Link key={l.href} to={l.href}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> {l.label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}