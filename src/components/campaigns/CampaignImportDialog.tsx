import { useCallback, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { campaignImportService } from "@/services/campaignImportService";
import {
  IMPORT_TEMPLATE_CSV,
  MAX_IMPORT_ROWS,
  parseCampaignResultFile,
  reprocessWithOverrides,
  summarizeBySeller,
  type DirectoryEntry,
  type DirectoryIndex,
  type ParseResult,
  type ReconciliationOverrides,
  type ResolvedResultRow,
} from "@/lib/campaignImport";
import { CampaignReconciliationPanel } from "./CampaignReconciliationPanel";
import { cn } from "@/lib/utils";

export interface CampaignImportDialogProps {
  campaignId: string;
  metricUnit?: string | null;
  onApplied?: () => void;
}

type Stage = "idle" | "parsing" | "preview" | "saving";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Fluxo completo: upload -> pre-visualizacao com erros por linha -> aplicacao transacional. */
export function CampaignImportDialog({ campaignId, metricUnit, onApplied }: CampaignImportDialogProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [rows, setRows] = useState<ResolvedResultRow[]>([]);
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [directoryIndex, setDirectoryIndex] = useState<DirectoryIndex | null>(null);
  const [reconciledCount, setReconciledCount] = useState(0);
  const [fatalError, setFatalError] = useState<string | null>(null);

  const validRows = useMemo(() => rows.filter((r) => r.status === "valid"), [rows]);
  const errorRows = useMemo(() => rows.filter((r) => r.status !== "valid"), [rows]);
  const sellers = useMemo(() => summarizeBySeller(rows), [rows]);
  const totalAmount = useMemo(() => validRows.reduce((acc, r) => acc + r.amount, 0), [validRows]);

  const reset = useCallback(() => {
    setStage("idle");
    setParsed(null);
    setRows([]);
    setDirectory([]);
    setDirectoryIndex(null);
    setReconciledCount(0);
    setFileName("");
    setFatalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setFatalError(null);
      if (file.size > MAX_FILE_BYTES) {
        setFatalError("Arquivo maior que 8 MB. Divida a planilha em lotes menores.");
        return;
      }
      setStage("parsing");
      setFileName(file.name);
      try {
        const result = await parseCampaignResultFile(file);
        const resolved = await campaignImportService.resolveWithDirectory(result);
        setParsed(result);
        setRows(resolved.rows);
        setDirectory(resolved.directory);
        setDirectoryIndex(resolved.index);
        setReconciledCount(0);
        setStage("preview");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Nao foi possivel ler o arquivo.";
        setFatalError(msg);
        setStage("idle");
      }
    },
    [],
  );

  /** Reaplica a resolucao com as correcoes manuais, sem reenviar o arquivo. */
  const handleReprocess = useCallback(
    (overrides: ReconciliationOverrides) => {
      if (!directoryIndex) return;
      const before = rows.filter((r) => r.status === "valid").length;
      const next = reprocessWithOverrides(rows, directoryIndex, overrides);
      const after = next.filter((r) => r.status === "valid").length;
      setRows(next);
      setReconciledCount((c) => c + Math.max(0, after - before));
      toast({
        title: "Linhas reprocessadas",
        description:
          after > before
            ? `${after - before} linha(s) recuperada(s) com as correções aplicadas.`
            : "Nenhuma linha adicional pôde ser recuperada com essas correções.",
      });
    },
    [rows, directoryIndex, toast],
  );

  const handleApply = useCallback(async () => {
    if (validRows.length === 0) return;
    setStage("saving");
    try {
      const importId = await campaignImportService.createImport({ campaignId, fileName, rows });
      const res = await campaignImportService.applyImport(importId);
      toast({
        title: "Resultados importados",
        description: `${res.applied} linha(s) contabilizada(s)${res.skipped ? `, ${res.skipped} ignorada(s) por duplicidade` : ""}.`,
      });
      onApplied?.();
      setOpen(false);
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao aplicar a importacao.";
      toast({ title: "Falha na importação", description: msg, variant: "destructive" });
      setStage("preview");
    }
  }, [campaignId, fileName, rows, validRows.length, toast, onApplied, reset]);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([`\ufeff${IMPORT_TEMPLATE_CSV}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-importacao-campanha.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar resultados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar resultados de vendas</DialogTitle>
          <DialogDescription>
            Envie um CSV ou XLSX com as colunas de colaborador e valor. Cada linha é validada antes de contabilizar,
            e resultados repetidos nunca são somados duas vezes.
          </DialogDescription>
        </DialogHeader>

        {fatalError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{fatalError}</AlertDescription>
          </Alert>
        )}

        {stage === "idle" || stage === "parsing" ? (
          <div className="space-y-4">
            <label
              htmlFor="campaign-import-file"
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors",
                stage === "parsing" ? "opacity-60" : "cursor-pointer hover:border-primary/60 hover:bg-muted/40",
              )}
            >
              {stage === "parsing" ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {stage === "parsing" ? "Lendo planilha..." : "Clique para selecionar a planilha"}
                </p>
                <p className="text-sm text-muted-foreground">
                  CSV ou XLSX, até {MAX_IMPORT_ROWS.toLocaleString("pt-BR")} linhas e 8 MB
                </p>
              </div>
              <input
                id="campaign-import-file"
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv"
                className="sr-only"
                disabled={stage === "parsing"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Baixar modelo de planilha
            </Button>
          </div>
        ) : null}

        {(stage === "preview" || stage === "saving") && parsed && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Linhas" value={rows.length.toLocaleString("pt-BR")} />
              <StatBox label="Válidas" value={validRows.length.toLocaleString("pt-BR")} tone="success" />
              <StatBox label="Com erro" value={errorRows.length.toLocaleString("pt-BR")} tone={errorRows.length ? "danger" : "muted"} />
              <StatBox
                label={`Total (${metricUnit ?? "un"})`}
                value={totalAmount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              />
            </div>

            {validRows.length === 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma linha válida encontrada. Corrija a planilha e envie novamente.
                </AlertDescription>
              </Alert>
            )}

            {sellers.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Resumo por colaborador ({sellers.length})</p>
                <ScrollArea className="h-40 rounded-lg border border-border">
                  <ul className="divide-y divide-border">
                    {sellers.map((s) => (
                      <li key={s.userId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="truncate">{s.sellerIdentifier}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {s.rows} linha(s) · {s.amount.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {errorRows.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-destructive">Linhas rejeitadas</p>
                <ScrollArea className="h-40 rounded-lg border border-destructive/40">
                  <ul className="divide-y divide-border">
                    {errorRows.slice(0, 200).map((r) => (
                      <li key={`${r.rowNumber}-${r.dedupeKey}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="truncate">
                          <Badge variant="outline" className="mr-2">L{r.rowNumber}</Badge>
                          {r.sellerIdentifier || "—"}
                        </span>
                        <span className="shrink-0 text-xs text-destructive">{r.errorReason}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={reset} disabled={stage === "saving"}>
                Trocar arquivo
              </Button>
              <Button onClick={handleApply} disabled={validRows.length === 0 || stage === "saving"} className="gap-2">
                {stage === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {stage === "saving" ? "Aplicando..." : `Aplicar ${validRows.length} linha(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "danger" | "muted" }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3",
        tone === "success" && "border-primary/40",
        tone === "danger" && "border-destructive/50",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", tone === "danger" && "text-destructive")}>{value}</p>
    </div>
  );
}
