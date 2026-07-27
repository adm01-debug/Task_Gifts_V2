import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Timer, Save } from "lucide-react";
import { validateSlaDraft, saveSlaTarget, formatMinutes } from "@/lib/slaTargets";
import { logger } from "@/services/loggingService";

export interface SlaTargetEditorProps {
  alertType: string;
  title: string;
  /** Valores atuais (minutos) — normalmente vindos de sla_targets, com fallback do runbook. */
  currentMttaMinutes: number;
  currentMttrMinutes: number;
  currentNotes?: string | null;
  disabled?: boolean;
}

/**
 * Diálogo de edição das metas de SLA (MTTA/MTTR) por tipo de alerta.
 * A validação usa exclusivamente o motor puro `validateSlaDraft`, já coberto por simulação.
 */
export function SlaTargetEditor({
  alertType, title, currentMttaMinutes, currentMttrMinutes, currentNotes, disabled,
}: SlaTargetEditorProps) {
  const [open, setOpen] = useState(false);
  const [mtta, setMtta] = useState(String(currentMttaMinutes));
  const [mttr, setMttr] = useState(String(currentMttrMinutes));
  const [notes, setNotes] = useState(currentNotes ?? "");
  const queryClient = useQueryClient();

  // Re-hidrata o formulário sempre que o diálogo abre (evita estado velho).
  useEffect(() => {
    if (open) {
      setMtta(String(currentMttaMinutes));
      setMttr(String(currentMttrMinutes));
      setNotes(currentNotes ?? "");
    }
  }, [open, currentMttaMinutes, currentMttrMinutes, currentNotes]);

  const validation = validateSlaDraft({ alertType, mttaMinutes: mtta, mttrMinutes: mttr, notes });

  const mutation = useMutation({
    mutationFn: () => saveSlaTarget(validation.normalized),
    onSuccess: async () => {
      toast.success("Metas de SLA atualizadas");
      await queryClient.invalidateQueries({ queryKey: ["sla-targets"] });
      setOpen(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Falha ao salvar as metas";
      logger.error("Erro ao salvar meta de SLA", { alertType, message });
      toast.error(message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" disabled={disabled}>
          <Timer className="w-3.5 h-3.5" />
          Editar SLA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Metas de SLA — {title}</DialogTitle>
          <DialogDescription>
            Tempo alvo para reconhecer (MTTA) e resolver (MTTR) alertas do tipo{" "}
            <code className="bg-muted px-1 rounded">{alertType}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sla-mtta">MTTA (min)</Label>
              <Input
                id="sla-mtta"
                inputMode="numeric"
                value={mtta}
                onChange={(e) => setMtta(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {formatMinutes(validation.normalized.mttaMinutes)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sla-mttr">MTTR (min)</Label>
              <Input
                id="sla-mttr"
                inputMode="numeric"
                value={mttr}
                onChange={(e) => setMttr(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                {formatMinutes(validation.normalized.mttrMinutes)}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sla-notes">Observações</Label>
            <Textarea
              id="sla-notes"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Justificativa da meta, acordo com o time responsável…"
            />
          </div>

          {validation.errors.length > 0 && (
            <ul className="space-y-1 text-xs text-destructive">
              {validation.errors.map((e) => <li key={e}>• {e}</li>)}
            </ul>
          )}
          {validation.warnings.length > 0 && (
            <ul className="space-y-1 text-xs text-yellow-600">
              {validation.warnings.map((w) => <li key={w}>• {w}</li>)}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!validation.valid || mutation.isPending}
            className="gap-1"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? "Salvando…" : "Salvar metas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
