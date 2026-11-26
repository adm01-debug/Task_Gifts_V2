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
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
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

  const updatePushEnabled = async (userId: string, next: boolean) => {
    const { data, error } = await supabase
      .from("notification_preferences")
      .update({ push_enabled: next })
      .eq("user_id", userId)
      .select("user_id");
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  };

  const persist = async (next: boolean) => {
    if (!user?.id) return;
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    try {
      // Atualiza só `push_enabled`: quem já salvou escolhas por tipo — inclusive em
      // outra aba, criando a linha depois que este card carregou — não pode perder nada.
      if (!(await updatePushEnabled(user.id, next))) {
        // Sem linha ainda: cria com `type_preferences` vazio, porque o DEFAULT do banco
        // já vem com xp/checkin/campaign_progress/development_tip em push=false.
        const { error: insertError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id, push_enabled: next, type_preferences: {} });
        // Insert pode ter falhado por corrida (outra tela criou a linha) ou por outro
        // motivo; só confirmamos a pausa se a linha existir de fato e aceitar o valor.
        if (insertError && !(await updatePushEnabled(user.id, next))) throw insertError;
      }
            toast.success(
              next ? "Push reativado em todos os dispositivos" : "Push pausado em todos os dispositivos",
            );
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
