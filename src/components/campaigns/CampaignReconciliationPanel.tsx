import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, RefreshCcw, Users, Wand2 } from "lucide-react";
import {
  buildReconciliationReport,
  findDirectoryCandidates,
  reconciliationIssueLabel,
  type DirectoryEntry,
  type DirectoryIndex,
  type ReconciliationEntry,
  type ReconciliationOverrides,
  type ResolvedResultRow,
} from "@/lib/campaignImport";
import { cn } from "@/lib/utils";

export interface CampaignReconciliationPanelProps {
  rows: ResolvedResultRow[];
  directory: DirectoryEntry[];
  index: DirectoryIndex;
  metricUnit?: string | null;
  disabled?: boolean;
  /** Reprocessa as linhas aplicando as correcoes escolhidas pelo operador. */
  onReprocess: (overrides: ReconciliationOverrides) => void;
}

const AUTO_MIN_SCORE = 0.9;

/**
 * Relatório de reconciliação: agrupa as linhas conflitantes/ambíguas por
 * identificador (CPF, e-mail, matrícula), sugere o colaborador correto e
 * permite reprocessar o arquivo com as correções — sem reenviar a planilha.
 */
export function CampaignReconciliationPanel({
  rows,
  directory,
  index,
  metricUnit,
  disabled,
  onReprocess,
}: CampaignReconciliationPanelProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const report = useMemo(
    () => buildReconciliationReport(rows, directory, index),
    [rows, directory, index],
  );

  const directoryOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = directory
      .filter((d) => d?.id)
      .map((d) => ({
        id: d.id,
        label: d.display_name?.trim() || d.email?.trim() || d.employee_id?.trim() || d.id,
        hint: d.email?.trim() ?? d.employee_id?.trim() ?? "",
      }));
    const filtered = term
      ? all.filter((o) => `${o.label} ${o.hint}`.toLowerCase().includes(term))
      : all;
    return filtered.slice(0, 50);
  }, [directory, search]);

  const pendingCount = Object.values(overrides).filter(Boolean).length;

  const applyAutoSuggestions = () => {
    const next = { ...overrides };
    report.entries.forEach((entry) => {
      if (!entry.resolvable || next[entry.key]) return;
      const best = entry.candidates[0];
      // Ambiguidade nunca é resolvida automaticamente: exige decisão humana.
      if (entry.issue === "not_found" && best && best.score >= AUTO_MIN_SCORE) {
        next[entry.key] = best.id;
      }
    });
    setOverrides(next);
  };

  if (report.entries.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Relatório de reconciliação
          </h3>
          <p className="text-xs text-muted-foreground">
            {report.totalIssueRows} linha(s) bloqueada(s) ·{" "}
            {report.blockedAmount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{" "}
            {metricUnit ?? "un"} fora da contagem · {report.resolvableKeys} identificador(es) corrigível(is)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-2"
            disabled={disabled || report.resolvableKeys === 0}
            onClick={applyAutoSuggestions}
          >
            <Wand2 className="h-4 w-4" />
            Sugerir correções
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            disabled={disabled || pendingCount === 0}
            onClick={() => onReprocess(overrides)}
          >
            <RefreshCcw className="h-4 w-4" />
            Reprocessar ({pendingCount})
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        {(Object.keys(report.byIssue) as Array<keyof typeof report.byIssue>).map((issue) =>
          report.byIssue[issue] > 0 ? (
            <Badge key={issue} variant="outline">
              {reconciliationIssueLabel(issue)}: {report.byIssue[issue]}
            </Badge>
          ) : null,
        )}
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar colaborador no diretório..."
        className="h-9"
        disabled={disabled}
      />

      <ScrollArea className="h-64 rounded-lg border border-border">
        <ul className="divide-y divide-border">
          {report.entries.map((entry) => (
            <ReconciliationRow
              key={`${entry.issue}-${entry.key || entry.rowNumbers[0]}`}
              entry={entry}
              directory={directory}
              options={directoryOptions}
              value={overrides[entry.key] ?? ""}
              disabled={disabled}
              onChange={(id) =>
                setOverrides((prev) => {
                  const next = { ...prev };
                  if (id) next[entry.key] = id;
                  else delete next[entry.key];
                  return next;
                })
              }
            />
          ))}
        </ul>
      </ScrollArea>
    </section>
  );
}

interface DirectoryOption {
  id: string;
  label: string;
  hint: string;
}

function ReconciliationRow({
  entry,
  directory,
  options,
  value,
  disabled,
  onChange,
}: {
  entry: ReconciliationEntry;
  directory: DirectoryEntry[];
  options: DirectoryOption[];
  value: string;
  disabled?: boolean;
  onChange: (id: string) => void;
}) {
  // Candidatos do relatório + busca livre, sem duplicar ids na lista.
  const merged = useMemo(() => {
    const suggestions = entry.candidates.length
      ? entry.candidates
      : findDirectoryCandidates(entry.displayIdentifier, directory, 3);
    const seen = new Set<string>();
    const list: Array<DirectoryOption & { score?: number; matchedOn?: string }> = [];
    suggestions.forEach((c) => {
      if (seen.has(c.id)) return;
      seen.add(c.id);
      list.push({ id: c.id, label: c.label, hint: c.matchedOn, score: c.score, matchedOn: c.matchedOn });
    });
    options.forEach((o) => {
      if (seen.has(o.id)) return;
      seen.add(o.id);
      list.push(o);
    });
    return list;
  }, [entry, directory, options]);

  return (
    <li className="grid gap-2 px-3 py-3 sm:grid-cols-[1fr_240px] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant={entry.issue === "ambiguous" ? "destructive" : "outline"} className="shrink-0">
            {entry.issue === "ambiguous"
              ? "Ambíguo"
              : entry.issue === "not_found"
                ? "Sem match"
                : entry.issue === "duplicate"
                  ? "Duplicado"
                  : "Inválido"}
          </Badge>
          <span className="truncate text-sm font-medium">{entry.displayIdentifier}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {entry.reason} · {entry.rows} linha(s) (L{entry.rowNumbers.slice(0, 6).join(", L")}
          {entry.rowNumbers.length > 6 ? "…" : ""}) ·{" "}
          {entry.amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
        </p>
      </div>

      {entry.resolvable ? (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={cn("h-9", value && "border-primary/60")}>
            <SelectValue placeholder="Atribuir colaborador" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {merged.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                <span className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{o.label}</span>
                  {typeof o.score === "number" && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(o.score * 100)}%
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className="text-xs text-muted-foreground">Corrija na planilha e reenvie</span>
      )}
    </li>
  );
}