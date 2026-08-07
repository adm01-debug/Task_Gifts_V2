import { useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBulkImportWagerQuestions } from "@/hooks/useWagerAdmin";
import {
  parseWagerImportCsv,
  WAGER_IMPORT_MAX_ROWS,
  WAGER_IMPORT_TEMPLATE,
  type WagerImportReport,
} from "@/lib/wagerBulkImport";
import { cn } from "@/lib/utils";

interface WagerBulkImportDialogProps {
  /** Datas já agendadas no banco, para sinalizar conflitos antes do envio. */
  existingDates: string[];
}

export function WagerBulkImportDialog({ existingDates }: WagerBulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<WagerImportReport | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const importMutation = useBulkImportWagerQuestions();

  const importable = useMemo(
    () => (report?.valid ?? []).filter((row) => !row.conflict),
    [report],
  );

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const content = await file.text();
      setFileName(file.name);
      setReport(parseWagerImportCsv(content, existingDates));
    } catch {
      toast.error("Não foi possível ler o arquivo selecionado.");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${WAGER_IMPORT_TEMPLATE}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modelo-perguntas-do-dia.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (importable.length === 0) return;
    try {
      const result = await importMutation.mutateAsync(importable.map((row) => row.draft));
      if (result.failures.length === 0) {
        toast.success(`${result.saved} pergunta(s) agendada(s) com sucesso.`);
        setOpen(false);
        setReport(null);
        setFileName(null);
      } else {
        toast.warning(
          `${result.saved} salva(s); ${result.failures.length} falharam (${result.failures
            .slice(0, 3)
            .map((f) => f.date)
            .join(", ")}).`,
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha na importação em lote.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendamento em lote</DialogTitle>
          <DialogDescription>
            Envie um CSV com até {WAGER_IMPORT_MAX_ROWS} perguntas. Nada é salvo antes da revisão
            abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Selecionar arquivo
          </Button>
          <Button variant="ghost" size="sm" className="gap-2" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Baixar modelo
          </Button>
          {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
        </div>

        {report && (
          <div className="space-y-3">
            {report.fatal.length > 0 ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {report.fatal.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {importable.length} prontas
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    {report.valid.length - importable.length} em conflito de data
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    {report.invalid.length} com erro
                  </Badge>
                </div>

                <ScrollArea className="h-64 rounded-lg border">
                  <ul className="divide-y">
                    {report.rows.map((row) => (
                      <li key={row.line} className="p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">
                            L{row.line} · {row.draft.scheduledDate || "sem data"}
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              row.errors.length > 0
                                ? "text-destructive"
                                : row.conflict
                                  ? "text-amber-500"
                                  : "text-emerald-500",
                            )}
                          >
                            {row.errors.length > 0
                              ? "Erro"
                              : row.conflict
                                ? "Data já agendada"
                                : "Pronta"}
                          </span>
                        </div>
                        <p className="truncate text-muted-foreground">
                          {row.draft.question || "(sem enunciado)"}
                        </p>
                        {row.errors.map((error) => (
                          <p key={error} className="text-xs text-destructive">
                            {error}
                          </p>
                        ))}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={importable.length === 0 || importMutation.isPending}
          >
            {importMutation.isPending
              ? "Importando…"
              : `Importar ${importable.length} pergunta(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default WagerBulkImportDialog;