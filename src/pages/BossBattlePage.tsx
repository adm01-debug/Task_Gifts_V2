import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Flame, Gauge, ShieldAlert, Skull, Sparkles, Swords, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { BossDamageSourcesCard } from "@/components/boss/BossDamageSourcesCard";
import { BossContributorsCard } from "@/components/boss/BossContributorsCard";
import { BossBattleAdminDialog } from "@/components/boss/BossBattleAdminDialog";
import { BossHistoryCard } from "@/components/boss/BossHistoryCard";
import { BossDepartmentComparisonCard } from "@/components/boss/BossDepartmentComparisonCard";
import { BossWinRateGoalsCard } from "@/components/boss/BossWinRateGoalsCard";
import { BossConsolidatedReportCard } from "@/components/boss/BossConsolidatedReportCard";
import { useRBAC } from "@/hooks/useRBAC";
import {
  useBossBattles,
  useExpireBossBattle,
  useMyBossDamage,
  usePublishBossBattle,
  useSettleBossBattle,
} from "@/hooks/useBossBattles";
import { bossPhase, hpPercent, type BossPhase } from "@/lib/bossBattle";
import type { BossBattleStatus } from "@/services/bossBattleService";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<BossBattleStatus, string> = {
  draft: "Rascunho",
  running: "Em andamento",
  defeated: "Derrotado",
  expired: "Expirado",
  settled: "Apurado",
};

const PHASE_LABEL: Record<BossPhase, string> = {
  healthy: "Intacto",
  wounded: "Ferido",
  enraged: "Enfurecido",
  critical: "Crítico",
  defeated: "Derrotado",
};

const PHASE_STYLE: Record<BossPhase, string> = {
  healthy: "border-primary/30 bg-primary/10 text-primary",
  wounded: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  enraged: "border-orange-500/40 bg-orange-500/10 text-orange-500",
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  defeated: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

const SOURCE_LABEL: Record<string, string> = {
  task_score: "Tarefa concluída",
  trail_completion: "Trilha concluída",
  attendance: "Check-in",
  quiz: "Quiz",
  manual: "Ajuste manual",
};

export default function BossBattlePage() {
  const { data: battles, isLoading } = useBossBattles();
  const { isAdmin } = useRBAC();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const settleMutation = useSettleBossBattle();
  const publishMutation = usePublishBossBattle();
  const expireMutation = useExpireBossBattle();

  const activeBattle = useMemo(() => {
    const list = battles || [];
    if (selectedId) return list.find((b) => b.id === selectedId) ?? null;
    return list.find((b) => b.status === "running") ?? list[0] ?? null;
  }, [battles, selectedId]);

  const { data: myDamage } = useMyBossDamage(activeBattle?.id);

  const myTotal = (myDamage || []).reduce((sum, entry) => sum + entry.damage, 0);
  const phase = activeBattle
    ? bossPhase({ totalHp: activeBattle.total_hp, currentHp: activeBattle.current_hp })
    : "healthy";
  const percent = activeBattle
    ? hpPercent({ totalHp: activeBattle.total_hp, currentHp: activeBattle.current_hp })
    : 0;

  return (
    <PageShell
      title="Chefão Departamental"
      subtitle="A barra de vida coletiva cai a cada entrega real do time. Derrotem o chefão antes do prazo."
      icon={<Skull className="h-6 w-6" />}
    >
      <SEOHead
        title="Chefão Departamental | Task Gifts"
        description="Batalha coletiva em que cada entrega do time reduz a vida do chefão antes do prazo."
      />

      <SectionErrorBoundary>
        {isAdmin && (
          <div className="mb-4 flex justify-end">
            <BossBattleAdminDialog />
          </div>
        )}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : !activeBattle ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Skull className="h-10 w-10 text-muted-foreground" />
              <p className="text-lg font-semibold">Nenhum chefão convocado</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Quando um gestor iniciar uma batalha, a vida do chefão aparecerá aqui e cada entrega
                do time causará dano automaticamente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {(battles || []).length > 1 && (
              <div className="flex flex-wrap gap-2">
                {(battles || []).map((battle) => (
                  <Button
                    key={battle.id}
                    size="sm"
                    variant={battle.id === activeBattle.id ? "default" : "outline"}
                    onClick={() => setSelectedId(battle.id)}
                  >
                    {battle.title}
                  </Button>
                ))}
              </div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Flame className="h-5 w-5 text-destructive" />
                      {activeBattle.title}
                    </CardTitle>
                    {activeBattle.description && (
                      <p className="text-sm text-muted-foreground">{activeBattle.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{STATUS_LABEL[activeBattle.status]}</Badge>
                    <Badge variant="outline" className={cn("border", PHASE_STYLE[phase])}>
                      {PHASE_LABEL[phase]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Vida do chefão</span>
                      <span className="tabular-nums text-muted-foreground">
                        {activeBattle.current_hp.toLocaleString("pt-BR")} /{" "}
                        {activeBattle.total_hp.toLocaleString("pt-BR")} ({percent}%)
                      </span>
                    </div>
                    <Progress value={percent} className="h-4" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <StatTile icon={Swords} label="Meu dano" value={myTotal.toLocaleString("pt-BR")} />
                    <StatTile
                      icon={Coins}
                      label="Prêmio em moedas"
                      value={activeBattle.coins_pool.toLocaleString("pt-BR")}
                    />
                    <StatTile
                      icon={Sparkles}
                      label="Prêmio em XP"
                      value={activeBattle.xp_pool.toLocaleString("pt-BR")}
                    />
                    <StatTile
                      icon={Gauge}
                      label="Limite por pessoa"
                      value={activeBattle.per_user_cap > 0 ? activeBattle.per_user_cap.toLocaleString("pt-BR") : "Sem limite"}
                    />
                  </div>

                  {isAdmin && activeBattle.settled_at === null && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-4">
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                      <p className="flex-1 text-sm text-muted-foreground">
                        A apuração distribui os prêmios proporcionalmente ao dano causado, com rateio
                        determinístico no servidor.
                      </p>
                      {activeBattle.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => publishMutation.mutate(activeBattle.id)}
                          disabled={publishMutation.isPending}
                        >
                          Publicar
                        </Button>
                      )}
                      {(activeBattle.status === "draft" || activeBattle.status === "running") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => expireMutation.mutate(activeBattle.id)}
                          disabled={expireMutation.isPending}
                        >
                          Encerrar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => settleMutation.mutate(activeBattle.id)}
                        disabled={settleMutation.isPending}
                      >
                        Apurar batalha
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <BossDamageSourcesCard
              rules={activeBattle.damage_rules}
              perUserCap={activeBattle.per_user_cap}
            />

            <BossContributorsCard
              battleId={activeBattle.id}
              totalDamage={Math.max(0, activeBattle.total_hp - activeBattle.current_hp)}
              coinsPool={activeBattle.coins_pool}
              xpPool={activeBattle.xp_pool}
              minShare={activeBattle.min_share}
              perUserCoinsCap={activeBattle.per_user_coins_cap}
              live={activeBattle.status === "running"}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Meus golpes recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(myDamage || []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Você ainda não causou dano nesta batalha. Conclua tarefas e trilhas para atacar.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {(myDamage || []).map((entry) => (
                      <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <p className="font-medium">{SOURCE_LABEL[entry.source] ?? entry.source}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold tabular-nums text-destructive">
                            -{entry.damage.toLocaleString("pt-BR")} HP
                          </p>
                          {entry.wasted > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {entry.wasted.toLocaleString("pt-BR")} perdidos por limite
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && (battles || []).length > 0 && (
          <div className="mt-6">
            <BossHistoryCard battles={battles || []} />
            <BossDepartmentComparisonCard battles={battles || []} />
            <BossWinRateGoalsCard battles={battles || []} />
            <BossConsolidatedReportCard battles={battles || []} />
          </div>
        )}
      </SectionErrorBoundary>
    </PageShell>
  );
}

interface StatTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function StatTile({ icon: Icon, label, value }: StatTileProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}