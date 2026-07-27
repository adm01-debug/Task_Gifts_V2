import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Coins,
  Ban,
  PlayCircle,
  Plus,
  Flame,
  Gauge,
  Shield,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useRBAC } from "@/hooks/useRBAC";
import {
  useDepartmentWarBoard,
  useDepartmentWarMetrics,
  useDepartmentWars,
  useMyWarContributions,
  useSettleDepartmentWar,
  useSetDepartmentWarStatus,
  useSyncWarHeadcount,
} from "@/hooks/useDepartmentWars";
import { DepartmentWarConfigDialog } from "@/components/war/DepartmentWarConfigDialog";
import { WarLiveFeed } from "@/components/war/WarLiveFeed";
import { warProgress } from "@/lib/departmentWar";
import type { DepartmentWarStatus } from "@/services/departmentWarService";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<DepartmentWarStatus, string> = {
  draft: "Rascunho",
  running: "Em andamento",
  finished: "Encerrada",
  cancelled: "Cancelada",
};

const SETTLE_ERROR: Record<string, string> = {
  forbidden: "Apenas administradores podem encerrar a guerra.",
  not_found: "Guerra não encontrada.",
  invalid_status: "Só é possível encerrar uma guerra em andamento.",
};

const PODIUM_STYLE: Record<number, string> = {
  1: "border-amber-400/40 bg-amber-400/10",
  2: "border-slate-300/40 bg-slate-300/10",
  3: "border-orange-500/40 bg-orange-500/10",
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function DepartmentWarPage() {
  const { data: wars, isLoading } = useDepartmentWars();
  const { isAdmin } = useRBAC();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [configOpen, setConfigOpen] = useState(false);

  const settleMutation = useSettleDepartmentWar();
  const statusMutation = useSetDepartmentWarStatus();
  const syncMutation = useSyncWarHeadcount();

  const activeId = useMemo(() => {
    if (selectedId) return selectedId;
    const running = (wars || []).find((w) => w.status === "running");
    return running?.id ?? wars?.[0]?.id ?? null;
  }, [selectedId, wars]);

  const { data: board, isLoading: loadingBoard } = useDepartmentWarBoard(activeId ?? undefined);
  const { data: metrics } = useDepartmentWarMetrics(activeId ?? undefined);
  const { data: myContributions } = useMyWarContributions(activeId ?? undefined);

  const war = board?.war;
  const standings = board?.standings ?? [];
  const progress = war ? warProgress(war.starts_at, war.ends_at) : 0;
  const totalContributors = standings.reduce((acc, s) => acc + s.contributors, 0);

  const handleSettle = async (id: string) => {
    try {
      const result = await settleMutation.mutateAsync(id);
      if (!result.success) {
        toast.error(SETTLE_ERROR[result.reason ?? ""] ?? "Não foi possível encerrar a guerra.");
        return;
      }
      toast.success("Guerra encerrada e prêmios creditados.");
    } catch {
      toast.error("Falha ao encerrar a guerra.");
    }
  };

  const handleSync = async (id: string) => {
    try {
      const result = await syncMutation.mutateAsync(id);
      if (!result.success) {
        toast.error(SETTLE_ERROR[result.reason ?? ""] ?? "Não foi possível sincronizar o efetivo.");
        return;
      }
      toast.success("Efetivo dos departamentos sincronizado.");
    } catch {
      toast.error("Falha ao sincronizar o efetivo.");
    }
  };

  const handleStatus = async (id: string, status: "running" | "cancelled") => {
    try {
      const result = await statusMutation.mutateAsync({ warId: id, status });
      if (!result.success) {
        toast.error(result.reason ?? "Não foi possível alterar a situação da guerra.");
        return;
      }
      toast.success(status === "running" ? "Guerra iniciada!" : "Guerra cancelada.");
    } catch {
      toast.error("Falha ao alterar a situação da guerra.");
    }
  };

  return (
    <PageShell
      title="Guerra de Departamentos"
      subtitle="Times competem por pontos ponderados — com equilíbrio automático entre áreas grandes e pequenas."
    >
      <SEOHead
        title="Guerra de Departamentos | Task Gifts"
        description="Competição entre áreas com pontuação ponderada, normalização por tamanho de equipe e prêmios em moedas e XP."
      />

      {isAdmin ? (
        <div className="mb-4 flex justify-end">
          <Button className="min-h-[44px]" onClick={() => setConfigOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova guerra
          </Button>
        </div>
      ) : null}

      <DepartmentWarConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        onCreated={(warId) => setSelectedId(warId)}
      />

      <SectionErrorBoundary sectionName="Guerra de Departamentos">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-[360px] w-full rounded-xl" />
          </div>
        ) : !wars || wars.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Swords className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma guerra ativa no momento. Novas disputas entre departamentos são
                abertas periodicamente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Seletor de guerras */}
            <div className="flex flex-wrap gap-2">
              {wars.map((item) => (
                <Button
                  key={item.id}
                  variant={item.id === activeId ? "default" : "outline"}
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => setSelectedId(item.id)}
                >
                  <Swords className="mr-2 h-4 w-4" />
                  {item.title}
                  <Badge variant="secondary" className="ml-2">
                    {STATUS_LABEL[item.status]}
                  </Badge>
                </Button>
              ))}
            </div>

            {loadingBoard || !war ? (
              <Skeleton className="h-[360px] w-full rounded-xl" />
            ) : (
              <>
                {/* Resumo */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-primary" />
                      {war.title}
                    </CardTitle>
                    {war.description ? (
                      <p className="text-sm text-muted-foreground">{war.description}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" /> Departamentos
                        </p>
                        <p className="text-xl font-semibold">{standings.length}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" /> Participantes ativos
                        </p>
                        <p className="text-xl font-semibold">{totalContributors}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Coins className="h-3.5 w-3.5" /> Prêmio total
                        </p>
                        <p className="text-xl font-semibold">
                          {war.coins_pool} moedas · {war.xp_pool} XP
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Gauge className="h-3.5 w-3.5" /> Fator de equilíbrio
                        </p>
                        <p className="text-xl font-semibold">
                          {war.fairness_alpha.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso da temporada</span>
                        <span>{formatPercent(progress)}</span>
                      </div>
                      <Progress value={progress * 100} />
                    </div>

                    {isAdmin ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-[44px]"
                          disabled={syncMutation.isPending}
                          onClick={() => handleSync(war.id)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Sincronizar efetivo
                        </Button>
                        {war.status === "draft" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px]"
                            disabled={statusMutation.isPending}
                            onClick={() => handleStatus(war.id, "running")}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Iniciar guerra
                          </Button>
                        ) : null}
                        {war.status === "draft" || war.status === "running" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px]"
                            disabled={statusMutation.isPending}
                            onClick={() => handleStatus(war.id, "cancelled")}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancelar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          className="min-h-[44px]"
                          disabled={settleMutation.isPending || !!war.settled_at || war.status !== "running"}
                          onClick={() => handleSettle(war.id)}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          {war.settled_at ? "Prêmios já creditados" : "Encerrar e premiar"}
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Placar */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Placar ao vivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {standings.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        Ainda não há pontos registrados nesta guerra.
                      </p>
                    ) : (
                      standings.map((standing, index) => {
                        const leader = standings[0]?.score || 1;
                        const relative = leader > 0 ? (standing.score / leader) * 100 : 0;
                        return (
                          <motion.div
                            key={standing.department_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.04, 0.4) }}
                            className={cn(
                              "rounded-xl border border-border/60 bg-card/50 p-4",
                              PODIUM_STYLE[standing.position],
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                  {standing.position}
                                </span>
                                <div>
                                  <p className="font-semibold">{standing.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {standing.contributors}/{standing.headcount} pessoas ·{" "}
                                    {formatPercent(standing.participation_rate)} de adesão
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold">
                                  {standing.score.toLocaleString("pt-BR", {
                                    maximumFractionDigits: 1,
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {standing.raw_score.toLocaleString("pt-BR", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  pts brutos
                                </p>
                              </div>
                            </div>
                            <Progress value={relative} className="mt-3 h-2" />
                          </motion.div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                {/* Métricas e contribuições */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <WarLiveFeed warId={war.id} className="lg:col-span-2" />

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Como pontuar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {!metrics || metrics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhuma métrica configurada para esta guerra.
                        </p>
                      ) : (
                        metrics.map((metric) => (
                          <div
                            key={metric.id}
                            className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                          >
                            <span className="text-sm">{metric.label}</span>
                            <Badge variant="secondary">
                              {metric.weight.toLocaleString("pt-BR")} pts
                            </Badge>
                          </div>
                        ))
                      )}
                      {war.per_user_cap > 0 ? (
                        <p className="pt-1 text-xs text-muted-foreground">
                          Teto de {war.per_user_cap} pontos por pessoa — o placar premia o time,
                          não o indivíduo.
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Sua contribuição</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {!myContributions || myContributions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Você ainda não pontuou nesta guerra. Complete tarefas e missões para
                          somar pelo seu departamento.
                        </p>
                      ) : (
                        myContributions.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                          >
                            <span className="text-muted-foreground">{item.metric_key}</span>
                            <span className="font-medium">
                              +{item.amount.toLocaleString("pt-BR")}
                            </span>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </SectionErrorBoundary>
    </PageShell>
  );
}