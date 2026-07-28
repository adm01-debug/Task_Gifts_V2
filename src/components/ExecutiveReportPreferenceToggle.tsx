import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FileBarChart } from "lucide-react";
import { logger } from "@/services/loggingService";
import {
  mergeChannelPreference,
  normalizeTypePrefs,
  resolveChannels,
  type ChannelMap,
  type NotificationChannel,
} from "@/lib/notificationTypePrefs";

/** Tipo lido pelas RPCs `user_wants_*_notification`. */
const EXECUTIVE_REPORT_TYPE = "executive_report";

/**
 * Defaults do módulo: o relatório executivo nunca vai por push (é um PDF/resumo
 * longo), mas chega no app e por e-mail salvo opt-out explícito.
 */
const EXECUTIVE_REPORT_DEFAULTS: ChannelMap = {
  in_app: true,
  push: false,
  email: true,
};

export function ExecutiveReportPreferenceToggle() {
  const { user } = useAuth();
  const { isAdmin, isLoading: rbacLoading } = useRBAC();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(true);

  useEffect(() => {
    if (!user?.id || !isAdmin) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("type_preferences")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        const resolved = resolveChannels(
          normalizeTypePrefs(data?.type_preferences),
          EXECUTIVE_REPORT_TYPE,
          EXECUTIVE_REPORT_DEFAULTS,
        );
        setInApp(resolved.in_app);
        setEmail(resolved.email);
      } catch (err: unknown) {
        logger.error("Falha ao carregar preferências do relatório executivo", String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, isAdmin]);

  /**
   * Persiste apenas a célula (tipo × canal) alterada.
   *
   * Regra crítica: se a leitura prévia falhar, abortamos em vez de gravar sobre
   * um estado desconhecido — caso contrário apagaríamos as preferências dos
   * demais módulos (campanhas, jogos) que compartilham o mesmo JSONB.
   */
  const persist = async (channel: NotificationChannel, value: boolean) => {
    if (!user?.id) return;
    const previous = channel === "in_app" ? inApp : email;
    setSaving(true);
    try {
      const { data: existing, error: readError } = await supabase
        .from("notification_preferences")
        .select("type_preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      if (readError) throw readError;
      const next = mergeChannelPreference(
        existing?.type_preferences,
        EXECUTIVE_REPORT_TYPE,
        channel,
        value,
        EXECUTIVE_REPORT_DEFAULTS,
        "high",
      );
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, type_preferences: next as unknown as Record<string, never> },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      toast.success("Preferência atualizada");
    } catch (err: unknown) {
      logger.error("Falha ao salvar preferência do relatório executivo", String(err));
      toast.error("Não foi possível salvar a preferência");
      // Rollback determinístico para o valor anterior ao clique.
      if (channel === "in_app") setInApp(previous);
      else setEmail(previous);
    } finally {
      setSaving(false);
    }
  };

  if (rbacLoading || !isAdmin) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileBarChart className="h-4 w-4 text-primary" aria-hidden />
          Relatório executivo mensal
        </CardTitle>
        <CardDescription>
          Resumo automático de incidentes, SLA e itens de ação enviado todo dia 1º.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="exec-report-inapp" className="text-sm">Receber no app</Label>
              <Switch
                id="exec-report-inapp"
                checked={inApp}
                disabled={saving}
                onCheckedChange={(v) => { setInApp(v); persist("in_app", v); }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exec-report-email" className="text-sm">Receber por e-mail</Label>
              <Switch
                id="exec-report-email"
                checked={email}
                disabled={saving}
                onCheckedChange={(v) => { setEmail(v); persist("email", v); }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ExecutiveReportPreferenceToggle;