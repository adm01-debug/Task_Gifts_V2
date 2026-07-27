import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Coins, HandCoins, Sparkles, Trophy, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useSalesCampaign } from "@/hooks/useSalesCampaigns";
import { useCampaignTeams } from "@/hooks/useCampaignTeams";
import { campaignImportService } from "@/services/campaignImportService";
import { previewTeamShares } from "@/lib/campaignTeamSplit";
import { cn } from "@/lib/utils";

/** Estética de pódio para as três primeiras equipes. */
const PODIUM = [
  "bg-gradient-to-br from-yellow-300 to-amber-500 text-yellow-950",
  "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900",
  "bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50",
];

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function formatAmount(value: number, unit: string): string {
  return `${numberFormatter.format(Number.isFinite(value) ? value : 0)} ${unit}`.trim();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(`${iso.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("pt-BR");
}

function initials(name: string | null | undefined): string {
  const clean = (name ?? "").trim();
  if (!clean) return "??";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Ranking coletivo com projeção de rateio e desempenho individual consolidado
 * a partir dos lotes de resultados já aplicados na campanha.
 */
export default function CampaignTeamRanking() {
  const { id } = useParams<{ id: string }>();
  const { campaign, participants, isLoading } = useSalesCampaign(id);
  const { teams, members, isLoading: isLoadingTeams } = useCampaignTeams(id);

  const results = useQuery({
    queryKey: ["campaign-results", id, "by-user"],
    queryFn: () => campaignImportService.aggregateAppliedByUser(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    document.title = campaign
      ? `Ranking por equipe · ${campaign.name}`
      : "Ranking por equipe | Campanhas";
  }, [campaign]);

  const unit = campaign?.metric_unit ?? "un";

  /** Índice de progresso individual (fonte oficial: campaign_participants). */
  const progressByUser = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach((p) => map.set(p.user_id, Number(p.progress) || 0));
    return map;
  }, [participants]);

  const profileByUser = useMemo(() => {
    const map = new Map<string, { display_name: string | null; avatar_url: string | null; level: number | null }>();
    participants.forEach((p) => {
      if (p.profile) map.set(p.user_id, p.profile);
    });
    members.forEach((m) => {
      if (m.profile && !map.has(m.user_id)) map.set(m.user_id, m.profile);
    });
    return map;
  }, [participants, members]);

  const importedByUser = useMemo(() => {
    const map = new Map<string, { amount: number; entries: number; last: string | null }>();
    (results.data ?? []).forEach((r) =>
      map.set(r.user_id, { amount: r.amount, entries: r.entries, last: r.last_reference_date }),
    );
    return map;
  }, [results.data]);

  /** Equipes ordenadas com membros enriquecidos e prévia do rateio. */
  const ranking = useMemo(() => {
    const membersByTeam = new Map<string, string[]>();
    members.forEach((m) => {
      const list = membersByTeam.get(m.team_id) ?? [];
      list.push(m.user_id);
      membersByTeam.set(m.team_id, list);
    });

    return [...teams]
      .map((team) => {
        const memberIds = membersByTeam.get(team.id) ?? [];
        const rows = memberIds.map((uid) => ({
          user_id: uid,
          progress: progressByUser.get(uid) ?? 0,
        }));
        const teamProgress = rows.reduce((sum, r) => sum + r.progress, 0);
        const shares = previewTeamShares(campaign?.split_rule ?? null, {
          teamProgress,
          members: rows,
        });
        const shareByUser = new Map(shares.map((s) => [s.user_id, s]));
        const percent =
          team.target_team > 0 ? Math.min(100, (teamProgress / team.target_team) * 100) : 0;

        return {
          team,
          teamProgress,
          percent,
          reachedGoal: team.target_team > 0 && teamProgress >= team.target_team,
          members: rows
            .map((r) => {
              const imported = importedByUser.get(r.user_id);
              const share = shareByUser.get(r.user_id);
              return {
                user_id: r.user_id,
                progress: r.progress,
                importedAmount: imported?.amount ?? 0,
                entries: imported?.entries ?? 0,
                lastDate: imported?.last ?? null,
                sharePercent: (share?.share ?? 0) * 100,
                xp: share?.xp ?? 0,
                coins: share?.coins ?? 0,
                profile: profileByUser.get(r.user_id) ?? null,
              };
            })
            .sort((a, b) => b.progress - a.progress || a.user_id.localeCompare(b.user_id)),
        };
      })
      .sort((a, b) => b.teamProgress - a.teamProgress || a.team.name.localeCompare(b.team.name));
  }, [teams, members, progressByUser, importedByUser, profileByUser, campaign?.split_rule]);

  const unassigned = useMemo(() => {
    const assigned = new Set(members.map((m) => m.user_id));
    return (results.data ?? [])
      .filter((r) => !assigned.has(r.user_id))
      .map((r) => ({ ...r, profile: profileByUser.get(r.user_id) ?? null }));
  }, [results.data, members, profileByUser]);

  const loading = isLoading || isLoadingTeams || results.isLoading;

  const totals = useMemo(() => {
    const importedTotal = (results.data ?? []).reduce((sum, r) => sum + r.amount, 0);
    const xpTotal = ranking.reduce(
      (sum, r) => sum + (r.reachedGoal ? r.members.reduce((s, m) => s + m.xp, 0) : 0),
      0,
    );
    const coinTotal = ranking.reduce(
      (sum, r) => sum + (r.reachedGoal ? r.members.reduce((s, m) => s + m.coins, 0) : 0),
      0,
    );
    return { importedTotal, xpTotal, coinTotal };
  }, [results.data, ranking]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pb-24">
      <header className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link to={id ? `/campanhas/${id}` : "/campanhas"}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar para a campanha
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Meta coletiva
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Ranking por equipe</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {campaign?.name ?? "Campanha"} — desempenho consolidado dos resultados importados e
          projeção do rateio coletivo por participante.
        </p>
      </header>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Resultado importado
              </div>
              <div className="mt-1 text-2xl font-bold">
                {formatAmount(totals.importedTotal, unit)}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                XP projetado no rateio
              </div>
              <div className="mt-1 text-2xl font-bold text-primary">{totals.xpTotal}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Moedas projetadas
              </div>
              <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
                <Coins className="h-5 w-5 text-muted-foreground" />
                {totals.coinTotal}
              </div>
            </Card>
          </div>

          {ranking.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Nenhuma equipe cadastrada</h2>
              <p className="mt-1 text-muted-foreground">
                Crie equipes na página da campanha para acompanhar o ranking coletivo.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {ranking.map((entry, index) => (
                <Card key={entry.team.id} className="overflow-hidden">
                  <div className="flex flex-wrap items-center gap-3 border-b p-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full font-bold",
                        index < 3 ? PODIUM[index] : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-lg font-semibold">{entry.team.name}</h2>
                        {entry.reachedGoal && (
                          <Badge className="gap-1">
                            <Trophy className="h-3 w-3" />
                            Meta batida
                          </Badge>
                        )}
                        {entry.team.awarded_at && (
                          <Badge variant="secondary" className="gap-1">
                            <HandCoins className="h-3 w-3" />
                            Rateio pago
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatAmount(entry.teamProgress, unit)} de{" "}
                        {formatAmount(entry.team.target_team, unit)} ·{" "}
                        {entry.members.length} participante(s)
                      </p>
                    </div>
                    <div className="w-full sm:w-56">
                      <Progress value={entry.percent} className="h-2" />
                      <div className="mt-1 text-right text-xs text-muted-foreground">
                        {entry.percent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {entry.members.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      Nenhum colaborador alocado nesta equipe.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Participante</TableHead>
                            <TableHead className="text-right">Progresso</TableHead>
                            <TableHead className="text-right">Importado</TableHead>
                            <TableHead className="text-right">Lançamentos</TableHead>
                            <TableHead className="text-right">Última venda</TableHead>
                            <TableHead className="text-right">Rateio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entry.members.map((m) => (
                            <TableRow key={m.user_id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                                    <AvatarFallback className="text-xs">
                                      {initials(m.profile?.display_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div className="truncate font-medium">
                                      {m.profile?.display_name ?? "Colaborador"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {m.sharePercent.toFixed(1)}% do prêmio
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatAmount(m.progress, unit)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatAmount(m.importedAmount, unit)}
                              </TableCell>
                              <TableCell className="text-right">{m.entries}</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatDate(m.lastDate)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-semibold text-primary">{m.xp} XP</div>
                                <div className="text-xs text-muted-foreground">
                                  {m.coins} moedas
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {!entry.reachedGoal && (
                    <p className="border-t bg-muted/30 p-3 text-xs text-muted-foreground">
                      Projeção informativa: o rateio só é pago quando a equipe atinge a meta
                      coletiva.
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}

          {unassigned.length > 0 && (
            <Card className="mt-6 p-4">
              <h2 className="mb-1 font-semibold">Resultados sem equipe</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Estes colaboradores têm resultados importados, mas não estão alocados em nenhuma
                equipe — portanto ficam fora do rateio coletivo.
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participante</TableHead>
                      <TableHead className="text-right">Importado</TableHead>
                      <TableHead className="text-right">Lançamentos</TableHead>
                      <TableHead className="text-right">Última venda</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassigned.map((u) => (
                      <TableRow key={u.user_id}>
                        <TableCell>{u.profile?.display_name ?? "Colaborador"}</TableCell>
                        <TableCell className="text-right">
                          {formatAmount(u.amount, unit)}
                        </TableCell>
                        <TableCell className="text-right">{u.entries}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(u.last_reference_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}