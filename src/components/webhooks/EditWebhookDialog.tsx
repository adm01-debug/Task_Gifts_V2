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

  useEffect(() => {
    if (!open || !subscriptionId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .select("name, events, is_active")
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
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, subscriptionId, onOpenChange]);

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