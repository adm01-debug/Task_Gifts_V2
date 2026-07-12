import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, KeyRound, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Selected {
  id: string;
  name: string | null;
}

interface BulkRotateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: Selected[];
}

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function BulkRotateDialog({ open, onOpenChange, selected }: BulkRotateDialogProps) {
  const [graceHours, setGraceHours] = useState(24);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();

  const ensureSecrets = () => {
    const next: Record<string, string> = { ...secrets };
    for (const s of selected) if (!next[s.id]) next[s.id] = generateSecret();
    setSecrets(next);
  };

  const handleOpen = (o: boolean) => {
    if (o) ensureSecrets();
    else { setSecrets({}); setGraceHours(24); }
    onOpenChange(o);
  };

  const regenerate = (id: string) => setSecrets((s) => ({ ...s, [id]: generateSecret() }));

  const copyAll = async () => {
    const lines = selected.map((s) => `${s.name || s.id}\t${secrets[s.id] || ""}`).join("\n");
    await navigator.clipboard.writeText(lines);
    toast.success("Secrets copiados (formato TSV: nome\\tsecret)");
  };

  const submit = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    const t = toast.loading(`Rotacionando ${selected.length} assinatura(s)…`);
    try {
      const payload = selected.map((s) => ({ subscription_id: s.id, secret: secrets[s.id] }));
      const { data, error } = await supabase.rpc("bulk_rotate_webhook_secrets" as never, {
        p_rotations: payload,
        p_grace_hours: graceHours,
      } as never);
      if (error) throw error;
      const rotated = (data as { rotated_count?: number })?.rotated_count ?? 0;
      toast.success(`Rotação iniciada em ${rotated} assinatura(s). Guarde os secrets — não serão exibidos novamente.`, { id: t, duration: 8000 });
      qc.invalidateQueries({ queryKey: ["webhook-pending-rotations"] });
      handleOpen(false);
    } catch (e) {
      toast.error(`Falha ao rotacionar: ${(e as Error).message}`, { id: t });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" />Rotação em lote de secrets HMAC</DialogTitle>
          <DialogDescription>
            {selected.length} assinatura(s) selecionada(s). Cada uma receberá um novo secret gerado localmente, com janela de graça uniforme.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-amber-500/40 bg-amber-500/5">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400">Copie os secrets antes de confirmar</AlertTitle>
          <AlertDescription>
            Após a rotação, os secrets não poderão ser recuperados. Distribua-os aos consumidores durante a janela de graça.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="grace">Janela de graça (horas, 1–168)</Label>
              <Input id="grace" type="number" min={1} max={168} value={graceHours}
                onChange={(e) => setGraceHours(Math.max(1, Math.min(168, Number(e.target.value) || 24)))} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={copyAll}>
              <Copy className="w-4 h-4 mr-1.5" />Copiar todos (TSV)
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3">
            {selected.map((s) => (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{s.name || s.id.slice(0, 8)}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => regenerate(s.id)}>
                    Regenerar
                  </Button>
                </div>
                <Input readOnly value={secrets[s.id] || ""} className="font-mono text-xs" />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpen(false)} disabled={submitting}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting || selected.length === 0}>
            {submitting ? "Rotacionando…" : `Rotacionar ${selected.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}