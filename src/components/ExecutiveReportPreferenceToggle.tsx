import { useCallback } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileBarChart } from "lucide-react";
import { useTypePreferences } from "@/hooks/useTypePreferences";
import type { ChannelMap } from "@/lib/notificationTypePrefs";

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
  const { isAdmin, isLoading: rbacLoading } = useRBAC();
  // Merge aditivo, rollback otimista e abort em falha de leitura vivem no hook.
  const defaultsFor = useCallback((): ChannelMap => EXECUTIVE_REPORT_DEFAULTS, []);
  const priorityFor = useCallback(() => "high", []);
  const { loading, saving, values, setCell } = useTypePreferences({
    types: [EXECUTIVE_REPORT_TYPE],
    defaultsFor,
    priorityFor,
    moduleName: "relatório executivo",
  });
  const current = values[EXECUTIVE_REPORT_TYPE] ?? EXECUTIVE_REPORT_DEFAULTS;

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
                checked={current.in_app}
                disabled={saving !== null}
                onCheckedChange={(v) => setCell(EXECUTIVE_REPORT_TYPE, "in_app", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exec-report-email" className="text-sm">Receber por e-mail</Label>
              <Switch
                id="exec-report-email"
                checked={current.email}
                disabled={saving !== null}
                onCheckedChange={(v) => setCell(EXECUTIVE_REPORT_TYPE, "email", v)}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ExecutiveReportPreferenceToggle;