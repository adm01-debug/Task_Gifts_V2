import { useEffect, useState } from "react";
import { useSalesCampaigns } from "@/hooks/useSalesCampaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CreateCampaignDialog } from "@/components/campaigns/CreateCampaignDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Sparkles } from "lucide-react";
import { useRBAC } from "@/hooks/useRBAC";
import { useDepartments } from "@/hooks/useDepartments";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SalesCampaign } from "@/services/salesCampaignsService";

const TABS: Array<{ value: SalesCampaign["status"] | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "draft", label: "Rascunhos" },
  { value: "completed", label: "Concluídas" },
];

export default function SalesCampaigns() {
  const [tab, setTab] = useState<SalesCampaign["status"] | "all">("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const { campaigns, isLoading } = useSalesCampaigns(tab === "all" ? undefined : tab);
  const { hasRole } = useRBAC();
  const { data: departments = [] } = useDepartments();
  const canCreate = hasRole("admin") || hasRole("manager");

  useEffect(() => {
    document.title = "Campanhas de Vendas | Gamificação";
  }, []);

  const filteredCampaigns = campaigns.filter((c) => {
    if (departmentFilter === "all") return true;
    if (departmentFilter === "global") return !c.department_id;
    return c.department_id === departmentFilter;
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24">
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
              <Sparkles className="h-4 w-4" />
              Incentivo & Reconhecimento
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Campanhas de Vendas</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Acompanhe metas individuais, coletivas e globais. Aceite sua meta, avance no ranking e conquiste XP + moedas.
            </p>
          </div>
          {canCreate && <CreateCampaignDialog />}
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os departamentos</SelectItem>
            <SelectItem value="global">Somente globais</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold">Nenhuma campanha por aqui</h3>
          <p className="text-muted-foreground mt-1">
            {departmentFilter !== "all"
              ? "Nenhuma campanha para este filtro. Ajuste o departamento."
              : canCreate
                ? "Crie a primeira campanha e engaje o time."
                : "Aguarde novas campanhas do seu gestor."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}