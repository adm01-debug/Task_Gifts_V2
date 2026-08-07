import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCampaignImports } from "@/hooks/useCampaignImports";
import type { CampaignImport } from "@/services/campaignImportService";

const STATUS_LABEL: Record<CampaignImport["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  applied: { label: "Aplicado", variant: "default" },
  reverted: { label: "Revertido", variant: "secondary" },
  failed: { label: "Falhou", variant: "destructive" },
};

export interface CampaignImportHistoryProps {
  campaignId: string;
  canManage: boolean;
}

/** Trilha auditavel dos lotes importados, com reversao segura. */
export function CampaignImportHistory({ campaignId, canManage }: CampaignImportHistoryProps) {
  const { imports, isLoading, revert, isReverting } = useCampaignImports(campaignId);

  if (isLoading || imports.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-bold">Histórico de importações</h2>
      </div>
      <ul className="divide-y divide-border">
        {imports.map((imp) => {
          const status = STATUS_LABEL[imp.status] ?? STATUS_LABEL.pending;
          return (
            <li key={imp.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{imp.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(imp.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} ·{" "}
                  {imp.applied_rows} aplicada(s) · {imp.error_rows} com erro
                  {imp.skipped_rows > 0 ? ` · ${imp.skipped_rows} duplicada(s)` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                {canManage && imp.status === "applied" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    disabled={isReverting}
                    onClick={() => {
                      if (window.confirm(`Reverter o lote "${imp.file_name}"? O progresso será desfeito.`)) {
                        revert(imp.id);
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reverter
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
