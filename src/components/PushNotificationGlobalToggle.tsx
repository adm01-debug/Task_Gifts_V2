import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { BellOff } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

/**
 * Toggle global do canal push. Persiste em `notification_preferences.push_enabled`
 * — o mesmo campo lido por `user_wants_push_notification(_user_id, _type)` dentro de
 * `enqueue_push`. Sem ele a fila descarta o aviso para todos os dispositivos, por mais
 * que a inscrição (`push_subscriptions`) esteja ativa e o tipo esteja ligado.
 *
 * Complementa (não substitui) o card por dispositivo e as preferências por tipo:
 * aqui é o silêncio geral sem desinscrever o aparelho.
 */
export function PushNotificationGlobalToggle() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("push_enabled")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        setEnabled(data?.push_enabled !== false);
      } catch (err: unknown) {
        logger.error("Falha ao carregar toggle global de push", String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const persist = async (next: boolean) => {
    if (!user?.id) return;
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, push_enabled: next }, { onConflict: "user_id" });
      if (error) throw error;
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
          desinscrever o aparelho nem perder as preferencias por tipo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-card/40 p-3">
            <div>
              <Label htmlFor="push-global" className="text-sm font-medium">
                Receber push em todos os dispositivos
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {enabled
                  ? "Ligado. Cada tipo de aviso ainda respeita o proprio interruptor."
                  : "Desligado. A fila descarta os avisos antes de enviar, mesmo com o aparelho inscrito."}
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