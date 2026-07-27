import { forwardRef, useMemo, useState } from "react";
import {
  ShieldAlert,
  Sparkles,
  History,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  usePurchaseTrail,
  useAnalyzePurchaseRisk,
  useReviewPurchase,
} from "@/hooks/usePurchaseGovernance";
import { RISK_LEVEL_CONFIG, type RiskFactor, type RiskLevel } from "@/lib/purchaseRisk";
import type { ShopPurchase } from "@/services/shopService";
import type { ApprovalAction } from "@/services/purchaseGovernanceService";

export interface PurchaseGovernanceDialogProps {
  purchase: (ShopPurchase & { profile?: { display_name: string; email: string } }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_LABEL: Record<ApprovalAction, string> = {
  requested: "Resgate solicitado",
  ai_review: "Análise de risco por IA",
  approve: "Aprovado",
  first_approval: "Primeira aprovação (dupla exigida)",
  reject: "Rejeitado",
  deliver: "Entregue",
  cancel: "Cancelado",
  reopen: "Reaberto",
};

function parseFactors(value: unknown): RiskFactor[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (f): f is RiskFactor =>
      Boolean(f) &&
      typeof f === "object" &&
      typeof (f as RiskFactor).label === "string" &&
      typeof (f as RiskFactor).points === "number"
  );
}

export const PurchaseGovernanceDialog = forwardRef<HTMLDivElement, PurchaseGovernanceDialogProps>(
  function PurchaseGovernanceDialog({ purchase, open, onOpenChange }, ref) {
    const [reason, setReason] = useState("");
    const analyze = useAnalyzePurchaseRisk();
    const review = useReviewPurchase();
    const { data: trail, isLoading: trailLoading } = usePurchaseTrail(open ? purchase?.id ?? null : null);

    const factors = useMemo(() => parseFactors(purchase?.risk_factors), [purchase?.risk_factors]);
    const level = (purchase?.risk_level ?? null) as RiskLevel | null;
    const riskConfig = level ? RISK_LEVEL_CONFIG[level] : null;
    const busy = analyze.isPending || review.isPending;

    if (!purchase) return null;

    const isTerminal = purchase.status === "delivered" || purchase.status === "cancelled";
    const awaitingSecond = Boolean(purchase.requires_dual_approval && purchase.first_approver_id);

    const handleReview = (action: "approve" | "deliver" | "cancel") => {
      review.mutate(
        { purchaseId: purchase.id, action, reason },
        { onSuccess: () => setReason("") }
      );
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent ref={ref} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Governança do resgate
            </DialogTitle>
            <DialogDescription>
              {purchase.reward?.name ?? "Recompensa"} •{" "}
              {purchase.profile?.display_name || purchase.profile?.email || "Colaborador"} • 🪙{" "}
              {purchase.total_coins} moedas
            </DialogDescription>
          </DialogHeader>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Análise de risco
              </h3>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => analyze.mutate(purchase.id)}
              >
                {analyze.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span className="ml-2">
                  {purchase.risk_analyzed_at ? "Reanalisar" : "Analisar com IA"}
                </span>
              </Button>
            </div>

            {purchase.risk_analyzed_at && riskConfig ? (
              <div className="rounded-xl border bg-card/60 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className={cn("border", riskConfig.badgeClass)}>
                    Risco {riskConfig.label}
                  </Badge>
                  <span className={cn("text-2xl font-bold tabular-nums", riskConfig.textClass)}>
                    {purchase.risk_score ?? 0}
                    <span className="text-sm text-muted-foreground font-normal">/100</span>
                  </span>
                </div>
                <Progress value={purchase.risk_score ?? 0} className="h-2" />

                {purchase.ai_summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {purchase.ai_summary}
                  </p>
                )}

                {factors.length > 0 && (
                  <ul className="space-y-1.5">
                    {factors.map((f) => (
                      <li key={f.code} className="flex items-start justify-between gap-3 text-sm">
                        <div>
                          <span className="font-medium">{f.label}</span>
                          <p className="text-xs text-muted-foreground">{f.detail}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 tabular-nums font-medium",
                            f.points > 0 ? "text-destructive" : "text-emerald-600"
                          )}
                        >
                          {f.points > 0 ? "+" : ""}
                          {f.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {purchase.requires_dual_approval && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-2 text-xs">
                    <UserCheck className="w-4 h-4 text-primary shrink-0" />
                    {awaitingSecond
                      ? "Primeira aprovação registrada — é necessário um segundo aprovador distinto."
                      : "Risco elevado: este resgate exige duas aprovações distintas."}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma análise executada ainda. A IA avalia valor, histórico de ganhos, frequência de
                resgates e escassez do item — a decisão final continua sendo sua.
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Decisão</h3>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Justificativa (fica registrada na trilha auditável)"
              maxLength={500}
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy || isTerminal || purchase.status !== "pending"}
                onClick={() => handleReview("approve")}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {awaitingSecond ? "Confirmar 2ª aprovação" : "Aprovar"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy || purchase.status !== "approved"}
                onClick={() => handleReview("deliver")}
              >
                <Truck className="w-4 h-4 mr-2" />
                Marcar como entregue
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy || isTerminal}
                onClick={() => handleReview("cancel")}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar e estornar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O cancelamento devolve automaticamente as moedas ao colaborador e repõe o estoque.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Trilha auditável
            </h3>
            {trailLoading ? (
              <p className="text-sm text-muted-foreground">Carregando histórico...</p>
            ) : !trail?.length ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma ação registrada para este resgate ainda.
              </p>
            ) : (
              <ScrollArea className="max-h-64 pr-3">
                <ol className="space-y-3">
                  {trail.map((entry) => (
                    <li key={entry.id} className="border-l-2 border-primary/30 pl-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {ACTION_LABEL[entry.action] ?? entry.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        por {entry.actor_name || "Sistema"}
                        {entry.from_status && entry.to_status
                          ? ` • ${entry.from_status} → ${entry.to_status}`
                          : ""}
                      </p>
                      {entry.reason && (
                        <p className="text-xs mt-1 bg-muted rounded p-2">{entry.reason}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            )}
          </section>
        </DialogContent>
      </Dialog>
    );
  }
);