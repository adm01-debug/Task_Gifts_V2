import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BellOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

/**
 * Toggle global do canal push. Persiste em `notification_preferences.push_enabled`
 * — o mesmo campo lido por `user_wants_push_notification(_user_id, _type)` em
 * `enqueue_push` e no `push-outbox-dispatcher` antes de enviar. Com ele desligado a
 * fila descarta o aviso para todos os dispositivos, por mais que a inscrição
 * (`push_subscriptions`) esteja ativa e o tipo esteja ligado.
 *
 * Complementa (não substitui) o card por dispositivo e as preferências por tipo:
 * aqui é o silêncio geral sem desinscrever o aparelho.
 */
export function PushNotificationGlobalToggle() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [hasRow, setHasRow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("push_enabled")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!alive) return;
        setHasRow(Boolean(data));
        setEnabled(data?.push_enabled !== false);
        setLoadError(false);
      } catch (err: unknown) {
        if (!alive) return;
        logger.error("Falha ao carregar toggle global de push", String(err));
        setLoadError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.id, reloadKey]);

  const persist = async (next: boolean) => {
    if (!user?.id) return;
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const payload: {
        user_id: string;
        push_enabled: boolean;
        type_preferences?: Record<string, never>;
      } = { user_id: user.id, push_enabled: next };
      // Sem linha previa, o INSERT aplicaria o DEFAULT de `type_preferences`, que ja
      // vem com xp/checkin/campaign_progress em push=false. Gravar `{}` preserva o
      // comportamento anterior ao toggle: tipo ausente continua ligado.
      if (!hasRow) payload.type_preferences = {};
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      setHasRow(true);
      toast.success(next ? "Push reativado em todos os dispositivos" : "Push pausado em todos os dispositivos");
    } catch (err: unknown) {
      logger.error("Falha ao salvar toggle global de push", String(err));
      toast.error("Nao foi possivel salvar a preferencia");
      setEnabled(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellOff className="h-4 w-4 text-primary" aria-hidden />
          Push neste usuario
        </CardTitle>
        <CardDescription>
          Vale para todos os dispositivos de uma vez. Desligue para um silencio temporario sem
          desinscrever o aparelho nem perder as preferencias por tipo. Alerta de seguranca do
          dispositivo (revogacao de acesso) continua sendo enviado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : loadError ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
              <p className="text-xs text-muted-foreground">
                Nao foi possivel carregar sua preferencia de push. O estado abaixo nao reflete o que
                esta salvo, entao nada foi alterado.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
            >
              <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
              Tentar de novo
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-card/40 p-3">
            <div>
              <Label htmlFor="push-global" className="text-sm font-medium">
                Receber push em todos os dispositivos
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {enabled
                  ? "Ligado. Cada tipo de aviso ainda respeita o proprio interruptor."
                  : "Desligado. Novos avisos e os que ainda estao na fila sao descartados antes do envio."}
              </p>
            </div>
            <Switch
              id="push-global"
              checked={enabled}
              disabled={saving}
              onCheckedChange={persist}
              aria-label="Receber push em todos os dispositivos"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PushNotificationGlobalToggle;