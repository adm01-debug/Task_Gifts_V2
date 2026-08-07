import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { KeyRound, RotateCw, ShieldCheck, X, Copy } from "lucide-react";

const COMMON_EVENTS = [
  "task.completed",
  "task.overdue",
  "user.level_up",
  "user.achievement_unlocked",
  "attendance.check_in",
  "quest.completed",
  "kudos.given",
  "test.ping",
];

function generateSecret(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

interface EditWebhookDialogProps {
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWebhookDialog({ subscriptionId, open, onOpenChange }: EditWebhookDialogProps) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [customEvent, setCustomEvent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [rotationBusy, setRotationBusy] = useState(false);
  const [pendingRotation, setPendingRotation] = useState<{ expires_at: string | null } | null>(null);
  const [newSecretVisible, setNewSecretVisible] = useState<string | null>(null);
  const [graceHours, setGraceHours] = useState(24);

  useEffect(() => {
    if (!open || !subscriptionId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .select("name, events, is_active, secret_next, secret_next_expires_at")
        .eq("id", subscriptionId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error(`Erro ao carregar: ${error.message}`);
        onOpenChange(false);
      } else if (data) {
        setName(data.name ?? "");
        setEvents((data.events as string[]) ?? []);
        setIsActive(!!data.is_active);
        setPendingRotation(
          (data as { secret_next?: string | null; secret_next_expires_at?: string | null }).secret_next
            ? { expires_at: (data as { secret_next_expires_at?: string | null }).secret_next_expires_at ?? null }
            : null,
        );
        setNewSecretVisible(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, subscriptionId, onOpenChange]);

  const startRotation = async () => {
    if (!subscriptionId) return;
    setRotationBusy(true);
    const secret = generateSecret();
    try {
      const { data, error } = await supabase.rpc("rotate_webhook_secret" as never, {
        p_subscription_id: subscriptionId,
        p_new_secret: secret,
        p_grace_hours: graceHours,
      } as never);
      if (error) throw error;
      const meta = data as { expires_at?: string } | null;
      setPendingRotation({ expires_at: meta?.expires_at ?? null });
      setNewSecretVisible(secret);
      await navigator.clipboard.writeText(secret).catch(() => {});
      toast.success("Novo secret gerado e copiado — atualize seu endpoint antes de promover.");
    } catch (e) {
      toast.error(`Falha ao rotacionar: ${(e as Error).message}`);
    } finally {
      setRotationBusy(false);
    }
  };

  const promoteRotation = async () => {
    if (!subscriptionId) return;
    if (!confirm("Promover novo secret? A assinatura antiga deixará de ser aceita.")) return;
    setRotationBusy(true);
    try {
      const { error } = await supabase.rpc("promote_webhook_secret" as never, {
        p_subscription_id: subscriptionId,
      } as never);
      if (error) throw error;
      setPendingRotation(null);
      setNewSecretVisible(null);
      toast.success("Rotação promovida — novo secret agora é o primário.");
    } catch (e) {
      toast.error(`Falha ao promover: ${(e as Error).message}`);
    } finally {
      setRotationBusy(false);
    }
  };

  const cancelRotation = async () => {
    if (!subscriptionId) return;
    setRotationBusy(true);
    try {
      const { error } = await supabase.rpc("cancel_webhook_secret_rotation" as never, {
        p_subscription_id: subscriptionId,
      } as never);
      if (error) throw error;
      setPendingRotation(null);
      setNewSecretVisible(null);
      toast.success("Rotação cancelada.");
    } catch (e) {
      toast.error(`Falha ao cancelar: ${(e as Error).message}`);
    } finally {
      setRotationBusy(false);
    }
  };

  const toggleEvent = (e: string) =>
    setEvents((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]));

  const addCustom = () => {
    const v = customEvent.trim();
    if (!v) return;
    if (!events.includes(v)) setEvents((prev) => [...prev, v]);
    setCustomEvent("");
  };

  const canSave = subscriptionId && name.trim().length >= 3 && events.length > 0 && !saving;

  const save = async () => {
    if (!canSave || !subscriptionId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("webhook_subscriptions")
        .update({ name: name.trim(), events, is_active: isActive })
        .eq("id", subscriptionId);
      if (error) throw error;
      toast.success("Assinatura atualizada");
      await qc.invalidateQueries({ queryKey: ["webhook-delivery-stats-24h"] });
      await qc.invalidateQueries({ queryKey: ["webhook-delivery-stats-1h"] });
      onOpenChange(false);
    } catch (e) {
      toast.error(`Falha ao salvar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const customEvents = events.filter((e) => !COMMON_EVENTS.includes(e));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar assinatura</DialogTitle>
          <DialogDescription>
            Ajuste nome, eventos e estado sem sair da página. O secret HMAC não pode ser editado aqui.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <Label className="mb-2 block">Eventos ({events.length})</Label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EVENTS.map((e) => {
                  const active = events.includes(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleEvent(e)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent hover:bg-muted border-border text-muted-foreground"
                      }`}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  placeholder="evento.customizado"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                />
                <Button variant="outline" onClick={addCustom} disabled={!customEvent.trim()}>+</Button>
              </div>
              {customEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {customEvents.map((e) => (
                    <Badge key={e} variant="secondary" className="cursor-pointer" onClick={() => toggleEvent(e)}>
                      {e} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-active" className="cursor-pointer">Ativa</Label>
                <p className="text-xs text-muted-foreground">Desative para pausar entregas.</p>
              </div>
              <Switch id="edit-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <Label className="font-medium">Rotação de secret HMAC</Label>
              </div>
              {pendingRotation ? (
                <>
                  <div className="text-xs text-muted-foreground">
                    Rotação em andamento — ambos os secrets são aceitos até{" "}
                    <span className="font-medium text-foreground">
                      {pendingRotation.expires_at ? new Date(pendingRotation.expires_at).toLocaleString("pt-BR") : "—"}
                    </span>
                    . O dispatcher envia <code>X-Webhook-Signature</code> (antigo) e <code>X-Webhook-Signature-Next</code> (novo).
                  </div>
                  {newSecretVisible && (
                    <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                      <Input readOnly value={newSecretVisible} className="font-mono text-xs h-8" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(newSecretVisible);
                          toast.success("Copiado");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={promoteRotation} disabled={rotationBusy}>
                      <ShieldCheck className="w-4 h-4 mr-1.5" />Promover agora
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelRotation} disabled={rotationBusy}>
                      <X className="w-4 h-4 mr-1.5" />Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Gera um novo secret e ativa período de dupla assinatura. Copie o valor exibido, atualize o endpoint e clique em Promover.
                  </p>
                  <div className="flex items-end gap-2">
                    <div className="w-32">
                      <Label htmlFor="grace" className="text-xs">Graça (horas)</Label>
                      <Input
                        id="grace"
                        type="number"
                        min={1}
                        max={168}
                        value={graceHours}
                        onChange={(e) => setGraceHours(Number(e.target.value))}
                      />
                    </div>
                    <Button size="sm" onClick={startRotation} disabled={rotationBusy}>
                      <RotateCw className={`w-4 h-4 mr-1.5 ${rotationBusy ? "animate-spin" : ""}`} />
                      Rotacionar secret
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={!canSave}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}