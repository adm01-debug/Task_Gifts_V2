import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

/**
 * Toggle global do canal in-app. Persiste em `notification_preferences.in_app_enabled`
 * — mesmo campo consultado por `user_wants_in_app_notification(_user_id, _type)`,
 * garantindo que a dispatch respeite o kill-switch global antes de olhar o
 * schema nested por tipo.
 */
export function InAppNotificationToggle() {
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
          .select("in_app_enabled")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        setEnabled(data?.in_app_enabled !== false);
      } catch (err: unknown) {
        logger.error("Falha ao carregar toggle in-app", String(err));
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
        .upsert({ user_id: user.id, in_app_enabled: next }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success(next ? "Notificações in-app ativadas" : "Notificações in-app pausadas");
    } catch (err: unknown) {
      logger.error("Falha ao salvar toggle in-app", String(err));
      toast.error("Não foi possível salvar a preferência");
      setEnabled(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4 text-primary" aria-hidden />
          Notificações in-app
        </CardTitle>
        <CardDescription>
          Kill-switch global. Quando desligado, você para de receber notificações dentro do sistema —
          preferências por tipo continuam salvas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-card/40 p-3">
            <Label htmlFor="in-app-global" className="text-sm font-medium">
              Receber notificações in-app
            </Label>
            <Switch
              id="in-app-global"
              checked={enabled}
              disabled={saving}
              onCheckedChange={persist}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InAppNotificationToggle;