import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamHealthReport, TeamHealthSeverity } from "@/lib/campaignTeamHealth";

export interface CampaignTeamHealthAlertProps {
  report: TeamHealthReport;
  className?: string;
}

const SEVERITY_STYLE: Record<TeamHealthSeverity, { icon: typeof AlertTriangle; className: string; label: string }> = {
  critical: { icon: ShieldAlert, className: "text-destructive", label: "Bloqueio" },
  warning: { icon: AlertTriangle, className: "text-amber-600 dark:text-amber-400", label: "Alerta" },
  info: { icon: Info, className: "text-muted-foreground", label: "Info" },
};

/** Painel de diagnóstico das equipes exibido ao gestor antes do rateio. */
export function CampaignTeamHealthAlert({ report, className }: CampaignTeamHealthAlertProps) {
  if (report.issues.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden />
        <span className="text-muted-foreground">
          Todas as equipes estão consistentes e prontas para o rateio.
        </span>
      </div>
    );
  }

  return (
    <section
      aria-label="Diagnóstico das equipes"
      className={cn(
        "rounded-lg border p-3 space-y-2",
        report.criticalCount > 0
          ? "border-destructive/40 bg-destructive/5"
          : "border-amber-500/40 bg-amber-500/5",
        className,
      )}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold">Diagnóstico das equipes</span>
        {report.criticalCount > 0 && (
          <Badge variant="destructive">{report.criticalCount} bloqueio(s)</Badge>
        )}
        {report.warningCount > 0 && (
          <Badge variant="secondary">{report.warningCount} alerta(s)</Badge>
        )}
        {report.infoCount > 0 && <Badge variant="outline">{report.infoCount} informativo(s)</Badge>}
      </div>
      <ul className="space-y-1.5">
        {report.issues.map((issue, index) => {
          const style = SEVERITY_STYLE[issue.severity];
          const Icon = style.icon;
          return (
            <li key={`${issue.code}-${issue.teamId ?? index}`} className="flex items-start gap-2 text-xs">
              <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", style.className)} aria-hidden />
              <span className="sr-only">{style.label}:</span>
              <span className="text-muted-foreground">{issue.message}</span>
            </li>
          );
        })}
      </ul>
      {report.criticalCount > 0 && (
        <p className="text-xs font-medium text-destructive">
          Corrija os bloqueios antes de executar o rateio para evitar pagamentos incorretos.
        </p>
      )}
    </section>
  );
}
