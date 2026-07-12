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

type TypePrefs = Record<string, { push?: boolean; email?: boolean; in_app?: boolean; priority?: string }>;

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
        const prefs = ((data?.type_preferences as TypePrefs) || {})["executive_report"] || {};
        setInApp(prefs.in_app ?? true);
        setEmail(prefs.email ?? true);
      } catch (err: unknown) {
        logger.error("Falha ao carregar preferências do relatório executivo", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, isAdmin]);

  const persist = async (nextInApp: boolean, nextEmail: boolean) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("type_preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      const current = (existing?.type_preferences as TypePrefs) || {};
      const next: TypePrefs = {
        ...current,
        executive_report: {
          push: false,
          in_app: nextInApp,
          email: nextEmail,
          priority: "high",
        },
      };
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, type_preferences: next }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Preferência atualizada");
    } catch (err: unknown) {
      logger.error("Falha ao salvar preferência do relatório executivo", err);
      toast.error("Não foi possível salvar a preferência");
      // revert on failure
      setInApp((v) => (v === nextInApp ? !nextInApp : v));
      setEmail((v) => (v === nextEmail ? !nextEmail : v));
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
                onCheckedChange={(v) => { setInApp(v); persist(v, email); }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exec-report-email" className="text-sm">Receber por e-mail</Label>
              <Switch
                id="exec-report-email"
                checked={email}
                disabled={saving}
                onCheckedChange={(v) => { setEmail(v); persist(inApp, v); }}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ExecutiveReportPreferenceToggle;