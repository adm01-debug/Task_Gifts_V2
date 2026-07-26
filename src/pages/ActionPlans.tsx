import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { MobilePageLayout } from "@/components/mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRBAC } from "@/hooks/useRBAC";
import {
  useActionPlanItems,
  useActionPlans,
  useUpdateActionItemStatus,
  useUpdateActionPlanStatus,
} from "@/hooks/useActionPlans";
import { ActionPlanCard } from "@/components/engagement/plans/ActionPlanCard";
import { ActionPlanItemList } from "@/components/engagement/plans/ActionPlanItemList";
import {
  PLAN_STATUS_LABEL,
  type ActionPlanStatus,
} from "@/services/actionPlansService";

const STATUS_OPTIONS: Array<{ value: ActionPlanStatus | "all"; label: string }> = [
  { value: "all", label: "Todos os status" },
  ...(Object.keys(PLAN_STATUS_LABEL) as ActionPlanStatus[]).map((status) => ({
    value: status,
    label: PLAN_STATUS_LABEL[status],
  })),
];

export default function ActionPlans() {
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<ActionPlanStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("plan"));

  const { isAdmin, isManager } = useRBAC();
  const canEdit = isAdmin || isManager;

  const plans = useActionPlans(status);
  const items = useActionPlanItems(selectedId);
  const updateItem = useUpdateActionItemStatus();
  const updatePlan = useUpdateActionPlanStatus();

  const selectedPlan = useMemo(
    () => (plans.data ?? []).find((plan) => plan.id === selectedId) ?? null,
    [plans.data, selectedId],
  );

  // Seleciona o primeiro plano quando nenhum foi indicado pela URL.
  useEffect(() => {
    if (!selectedId && (plans.data ?? []).length > 0) {
      setSelectedId(plans.data![0].id);
    }
  }, [plans.data, selectedId]);

  useEffect(() => {
    if (selectedId && searchParams.get("plan") !== selectedId) {
      const next = new URLSearchParams(searchParams);
      next.set("plan", selectedId);
      setSearchParams(next, { replace: true });
    }
  }, [selectedId, searchParams, setSearchParams]);

  const content = (
    <div className="space-y-6">
      <Select value={status} onValueChange={(value) => setStatus(value as ActionPlanStatus | "all")}>
        <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filtrar por status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {plans.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {!plans.isLoading && (plans.data ?? []).length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum plano de ação neste filtro. Gere um plano automaticamente a partir de um fator
          crítico no Diagnóstico de Clima.
        </p>
      )}

      {!plans.isLoading && (plans.data ?? []).length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="space-y-3">
            {(plans.data ?? []).map((plan) => (
              <ActionPlanCard
                key={plan.id}
                plan={plan}
                isSelected={plan.id === selectedId}
                onSelect={(selected) => setSelectedId(selected.id)}
              />
            ))}
          </div>

          <div className="space-y-4">
            {selectedPlan && (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedPlan.title}</h2>
                    {selectedPlan.root_cause_summary && (
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan.root_cause_summary}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <Select
                      value={selectedPlan.status}
                      onValueChange={(value) =>
                        updatePlan.mutate({
                          planId: selectedPlan.id,
                          status: value as ActionPlanStatus,
                        })
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[190px]" aria-label="Status do plano">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PLAN_STATUS_LABEL) as ActionPlanStatus[]).map((value) => (
                          <SelectItem key={value} value={value}>
                            {PLAN_STATUS_LABEL[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <ActionPlanItemList
                  items={items.data ?? []}
                  isLoading={items.isLoading}
                  canEdit={canEdit}
                  onChangeStatus={(itemId, itemStatus) =>
                    updateItem.mutate({ itemId, status: itemStatus })
                  }
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PageShell title="Planos de Ação">
      {isMobile ? (
        <MobilePageLayout
          title="Planos de Ação"
          icon={ClipboardList}
          backPath="/engajamento/diagnostico"
          subtitle="Ações 5W2H para elevar o clima"
        >
          {content}
        </MobilePageLayout>
      ) : (
        <div className="space-y-6">
          <header>
            <h1 className="text-2xl font-bold">Planos de Ação</h1>
            <p className="text-sm text-muted-foreground">
              Ações 5W2H derivadas dos fatores críticos do diagnóstico de engajamento.
            </p>
          </header>
          {content}
        </div>
      )}
    </PageShell>
  );
}
