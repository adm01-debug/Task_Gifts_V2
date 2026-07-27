import { useMemo, useState } from "react";
import { AlertTriangle, Dices, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  LuckyWheelAuditTrail,
  LuckyWheelPayoutPanel,
  LuckyWheelPayoutTrend,
  LuckyWheelWindowComparison,
} from "@/components/luckywheel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useCreateLuckyWheelPrize,
  useDeleteLuckyWheelPrize,
  useLuckyWheelAdminPrizes,
  useSaveLuckyWheelPrizes,
} from "@/hooks/useLuckyWheel";
import {
  hasBlockingIssues,
  projectBudget,
  projectWheel,
  validateWheelConfig,
  type OddsPrize,
} from "@/lib/luckyWheelOdds";
import type { LuckyWheelPrize, LuckyWheelPrizeType, LuckyWheelRarity } from "@/services/luckyWheelService";

const TYPE_LABEL: Record<LuckyWheelPrizeType, string> = {
  coins: "Moedas",
  xp: "XP",
  achievement: "Conquista",
  nothing: "Nada",
};

const RARITY_LABEL: Record<LuckyWheelRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

type Draft = Pick<LuckyWheelPrize, "id" | "label" | "prize_type" | "amount" | "weight" | "rarity" | "is_active">;

function toDraft(prize: LuckyWheelPrize): Draft {
  return {
    id: prize.id,
    label: prize.label,
    prize_type: prize.prize_type,
    amount: prize.amount,
    weight: prize.weight,
    rarity: prize.rarity,
    is_active: prize.is_active,
  };
}

function toOddsPrize(draft: Draft): OddsPrize {
  return { ...draft, achievement_id: null };
}

export default function LuckyWheelAdmin() {
  const { data: prizes, isLoading } = useLuckyWheelAdminPrizes();
  const saveMutation = useSaveLuckyWheelPrizes();
  const createMutation = useCreateLuckyWheelPrize();
  const deleteMutation = useDeleteLuckyWheelPrize();

  const [edits, setEdits] = useState<Record<string, Partial<Draft>>>({});
  const [activeUsers, setActiveUsers] = useState(200);
  const [participation, setParticipation] = useState(60);

  const drafts = useMemo<Draft[]>(
    () => (prizes ?? []).map((prize) => ({ ...toDraft(prize), ...edits[prize.id] })),
    [prizes, edits],
  );

  const projection = useMemo(() => projectWheel(drafts.map(toOddsPrize)), [drafts]);
  const issues = useMemo(() => validateWheelConfig(drafts.map(toOddsPrize)), [drafts]);
  const blocked = hasBlockingIssues(issues);
  const budget = useMemo(
    () => projectBudget(projection, { activeUsers, participationRate: participation / 100, days: 30 }),
    [projection, activeUsers, participation],
  );

  const dirtyIds = Object.keys(edits);
  const isDirty = dirtyIds.length > 0;

  const patch = (id: string, value: Partial<Draft>) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...value } }));
  };

  const handleSave = async () => {
    if (blocked) {
      toast.error("Corrija os erros de configuração antes de salvar.");
      return;
    }
    try {
      await saveMutation.mutateAsync(dirtyIds.map((id) => ({ id, ...edits[id] })));
      setEdits({});
      toast.success("Calibração salva. Novos giros já usam os pesos atualizados.");
    } catch {
      toast.error("Não foi possível salvar a calibração.");
    }
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        label: "Novo prêmio",
        prize_type: "coins",
        amount: 10,
        weight: 10,
        color: "hsl(var(--primary))",
        icon: "gift",
        rarity: "common",
        is_active: false,
      });
      toast.success("Prêmio criado como inativo. Calibre e ative quando estiver pronto.");
    } catch {
      toast.error("Não foi possível criar o prêmio.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Prêmio removido.");
    } catch {
      toast.error("Não foi possível remover o prêmio.");
    }
  };

  return (
    <>
      <SEOHead
        title="Calibrar Roleta da Sorte | Task Gifts"
        description="Ajuste pesos, raridades e projeção econômica dos prêmios da Roleta da Sorte."
      />
      <PageShell
        title="Calibração da Roleta"
        subtitle="Ajuste os pesos e veja em tempo real a probabilidade e o custo mensal de cada setor."
        icon={<Dices className="h-5 w-5" />}
        backFallback="/roleta"
      >
        <SectionErrorBoundary sectionName="Calibração da Roleta">
          <div className="space-y-6">
          <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={handleCreate} disabled={createMutation.isPending}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Novo prêmio
          </Button>
          <Button variant="ghost" onClick={() => setEdits({})} disabled={!isDirty}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
            Descartar
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || blocked || saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" aria-hidden />
            {saveMutation.isPending ? "Salvando..." : "Salvar calibração"}
          </Button>
          </div>

            {issues.length > 0 && (
              <Alert variant={blocked ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" aria-hidden />
                <AlertTitle>
                  {blocked ? "Configuração inválida" : "Avisos de calibração"}
                </AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                    {issues.map((issue) => (
                      <li key={`${issue.code}-${issue.prizeId ?? "geral"}`}>{issue.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card className="bg-card/70 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription>Setores ativos</CardDescription>
                  <CardTitle className="text-2xl">{projection.activeCount}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Peso total: {projection.totalWeight}
                </CardContent>
              </Card>
              <Card className="bg-card/70 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription>Moedas por giro</CardDescription>
                  <CardTitle className="text-2xl">{projection.expectedCoinsPerSpin.toFixed(1)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">Valor esperado (média)</CardContent>
              </Card>
              <Card className="bg-card/70 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription>XP por giro</CardDescription>
                  <CardTitle className="text-2xl">{projection.expectedXpPerSpin.toFixed(1)}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">Valor esperado (média)</CardContent>
              </Card>
              <Card className="bg-card/70 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardDescription>Giros sem prêmio</CardDescription>
                  <CardTitle className="text-2xl">{(projection.emptyProbability * 100).toFixed(1)}%</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Recompensa variável saudável: 15% a 40%
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Projeção de custo em 30 dias</CardTitle>
                <CardDescription>
                  Estimativa de injeção de moedas e XP na economia com a calibração atual.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="active-users">Usuários ativos</Label>
                  <Input
                    id="active-users"
                    type="number"
                    min={0}
                    value={activeUsers}
                    onChange={(e) => setActiveUsers(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participation">Adesão diária (%)</Label>
                  <Input
                    id="participation"
                    type="number"
                    min={0}
                    max={100}
                    value={participation}
                    onChange={(e) => setParticipation(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">{budget.spins.toLocaleString("pt-BR")} giros/mês</p>
                  <p className="text-sm font-semibold text-foreground">
                    {budget.coins.toLocaleString("pt-BR")} moedas
                  </p>
                  <p className="text-sm font-semibold text-foreground">{budget.xp.toLocaleString("pt-BR")} XP</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Prêmios</CardTitle>
                <CardDescription>
                  O sorteio acontece no servidor: estes pesos alimentam a RPC segura, nunca o navegador.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : drafts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Nenhum prêmio cadastrado ainda.
                  </p>
                ) : (
                  drafts.map((draft) => {
                    const odds = projection.odds.find((o) => o.id === draft.id);
                    const probability = odds ? odds.probability * 100 : 0;
                    return (
                      <div
                        key={draft.id}
                        className="rounded-xl border border-border/60 bg-background/40 p-4"
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
                          <div className="space-y-1.5 md:col-span-3">
                            <Label htmlFor={`label-${draft.id}`}>Rótulo</Label>
                            <Input
                              id={`label-${draft.id}`}
                              value={draft.label}
                              maxLength={40}
                              onChange={(e) => patch(draft.id, { label: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor={`type-${draft.id}`}>Tipo</Label>
                            <Select
                              value={draft.prize_type}
                              onValueChange={(value) =>
                                patch(draft.id, { prize_type: value as LuckyWheelPrizeType })
                              }
                            >
                              <SelectTrigger id={`type-${draft.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(TYPE_LABEL) as LuckyWheelPrizeType[]).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {TYPE_LABEL[type]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor={`amount-${draft.id}`}>Valor</Label>
                            <Input
                              id={`amount-${draft.id}`}
                              type="number"
                              min={0}
                              value={draft.amount}
                              onChange={(e) => patch(draft.id, { amount: Number(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor={`weight-${draft.id}`}>Peso</Label>
                            <Input
                              id={`weight-${draft.id}`}
                              type="number"
                              min={1}
                              value={draft.weight}
                              onChange={(e) => patch(draft.id, { weight: Number(e.target.value) || 0 })}
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor={`rarity-${draft.id}`}>Raridade</Label>
                            <Select
                              value={draft.rarity}
                              onValueChange={(value) => patch(draft.id, { rarity: value as LuckyWheelRarity })}
                            >
                              <SelectTrigger id={`rarity-${draft.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(RARITY_LABEL) as LuckyWheelRarity[]).map((rarity) => (
                                  <SelectItem key={rarity} value={rarity}>
                                    {RARITY_LABEL[rarity]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center justify-between gap-2 md:col-span-1">
                            <Switch
                              checked={draft.is_active}
                              aria-label={`Ativar ${draft.label}`}
                              onCheckedChange={(checked) => patch(draft.id, { is_active: checked })}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Remover ${draft.label}`}
                              onClick={() => handleDelete(draft.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Badge variant={draft.is_active ? "secondary" : "outline"}>
                            {draft.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <div className="min-w-[160px] flex-1">
                            <Progress value={probability} className="h-2" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {draft.is_active
                              ? `${probability.toFixed(2)}% · 1 em ${
                                  odds && Number.isFinite(odds.oneIn) ? Math.round(odds.oneIn) : "—"
                                } giros`
                              : "Fora do sorteio"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <LuckyWheelPayoutPanel />

            <LuckyWheelPayoutTrend />

            <LuckyWheelWindowComparison />

            <LuckyWheelAuditTrail />
          </div>
        </SectionErrorBoundary>
      </PageShell>
    </>
  );
}
