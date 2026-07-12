import { useMemo, useState, useEffect } from "react";
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
import { ArrowLeft, FileText, Save, ExternalLink, Search } from "lucide-react";
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
  created_at: string;
  updated_at: string;
};

const STATUS_LABEL: Record<Postmortem["status"], string> = {
  draft: "Rascunho",
  in_review: "Em revisão",
  published: "Publicado",
};

function fmtDur(sec: number | null) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}min`;
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return m ? `${h}h ${m}min` : `${h}h`;
}

export default function Postmortems() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("id");

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

  const filtered = useMemo(() => {
    return list.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        return p.title.toLowerCase().includes(s) || (p.alert_type ?? "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [list, search, statusFilter]);

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
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título/tipo…" className="pl-7 h-9" />
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
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="text-xs text-muted-foreground text-center py-6">Carregando…</div>
              ) : filtered.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">Nenhum postmortem.</div>
              ) : filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setParams({ id: p.id })}
                  className={`w-full text-left p-2 rounded border transition-colors ${
                    selectedId === p.id ? "bg-primary/10 border-primary/40" : "hover:bg-muted/50 border-transparent"
                  }`}
                >
                  <div className="text-sm font-medium line-clamp-1">{p.title}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px] font-mono">{STATUS_LABEL[p.status]}</Badge>
                    {p.alert_type && <Badge variant="outline" className="text-[10px] font-mono">{p.alert_type}</Badge>}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {selected ? (
          <Editor key={selected.id} initial={selected} onSaved={() => qc.invalidateQueries({ queryKey: ["postmortems"] })} />
        ) : (
          <Card><CardContent className="p-8 text-sm text-muted-foreground text-center">Selecione um postmortem à esquerda.</CardContent></Card>
        )}
      </div>
    </div>
  );
}

function Editor({ initial, onSaved }: { initial: Postmortem; onSaved: () => void }) {
  const [draft, setDraft] = useState<Postmortem>(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

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
            {draft.severity && <Badge variant="outline" className="text-[10px]">{draft.severity}</Badge>}
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