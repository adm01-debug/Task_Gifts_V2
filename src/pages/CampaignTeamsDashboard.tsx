import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Coins,
  HandCoins,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useCampaignTeamsDashboard } from "@/hooks/useCampaignTeamsDashboard";
import { PERIOD_OPTIONS } from "@/lib/campaignTeamMetrics";
import { cn } from "@/lib/utils";

const PODIUM = [
  "bg-gradient-to-br from-yellow-300 to-amber-500 text-yellow-950",
  "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900",
  "bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50",
];

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}

function MetricCard({ label, value, hint, icon }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

/**
 * Dashboard consolidado de ranking por equipe: contribuição, atingimento e
 * pagamentos já realizados, com filtros por campanha e por período.
 */
export default function CampaignTeamsDashboard() {
  const {
    campaignId,
    setCampaignId,
    period,
    setPeriod,
    campaigns,
    visibleCampaigns,
    rows,
    summary,
    isLoading,
  } = useCampaignTeamsDashboard();

  useEffect(() => {
    document.title = "Dashboard de equipes | Campanhas";
  }, []);

  /** Unidade exibida: única quando o recorte é de uma só campanha. */
  const unit = useMemo(() => {
    const units = new Set(visibleCampaigns.map((c) => c.metric_unit || "un"));
    return units.size === 1 ? [...units][0] : "un";
  }, [visibleCampaigns]);

  const globalPercent = summary.target > 0
    ? Math.min(100, (summary.contribution / summary.target) * 100)
    : 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24">
      <header className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link to="/campanhas">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar para campanhas
          </Link>
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          Metas coletivas
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Dashboard de ranking por equipe
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Contribuição, atingimento e pagamentos das equipes consolidados por campanha e período.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Filtrar por campanha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as campanhas</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="h-9 gap-1 px-3">
          {visibleCampaigns.length} campanha(s) no recorte
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Contribuição total"
              value={`${formatNumber(summary.contribution)} ${unit}`}
              hint={`Meta somada: ${formatNumber(summary.target)} ${unit}`}
              icon={<Target className="h-4 w-4" />}
            />
            <MetricCard
              label="Atingimento médio"
              value={`${summary.averageProgress.toFixed(1)}%`}
              hint={`${summary.goalsReached} de ${summary.teams} equipe(s) bateram a meta`}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <MetricCard
              label="Pagamentos totais"
              value={`${formatNumber(summary.xpPaid)} XP`}
              hint={`${formatNumber(summary.coinsPaid)} moedas · ${summary.teamsPaid} rateio(s) pagos`}
              icon={<HandCoins className="h-4 w-4" />}
            />
            <MetricCard
              label="Equipes e pessoas"
              value={`${summary.teams} / ${summary.members}`}
              hint={`Equipes em ${summary.campaigns} campanha(s)`}
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          <Card className="mb-6 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Atingimento consolidado do recorte</span>
              <span className="text-muted-foreground">{globalPercent.toFixed(1)}%</span>
            </div>
            <Progress value={globalPercent} className="h-2" />
          </Card>

          {rows.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Nenhuma equipe no recorte</h2>
              <p className="mt-1 text-muted-foreground">
                Ajuste os filtros de campanha e período ou crie equipes na página da campanha.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead className="text-right">Contribuição</TableHead>
                      <TableHead className="text-right">Por pessoa</TableHead>
                      <TableHead className="w-40">Progresso</TableHead>
                      <TableHead className="text-right">Pagamentos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={row.team.id}>
                        <TableCell>
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                              index < 3 ? PODIUM[index] : "bg-muted text-muted-foreground",
                            )}
                          >
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            {row.team.name}
                            {row.reachedGoal && (
                              <Badge className="gap-1">
                                <Trophy className="h-3 w-3" />
                                Meta
                              </Badge>
                            )}
                            {row.paid && (
                              <Badge variant="secondary" className="gap-1">
                                <HandCoins className="h-3 w-3" />
                                Pago
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.membersCount} participante(s)
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          {row.campaign ? (
                            <Link
                              to={`/campanhas/${row.team.campaign_id}/ranking-equipes`}
                              className="block truncate text-sm text-primary hover:underline"
                            >
                              {row.campaign.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatNumber(row.contribution)}
                          <span className="ml-1 text-xs text-muted-foreground">
                            / {formatNumber(row.target)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(row.contributionPerMember)}
                        </TableCell>
                        <TableCell>
                          <Progress value={row.progressPercent} className="h-2" />
                          <div className="mt-1 text-right text-xs text-muted-foreground">
                            {row.progressPercent.toFixed(1)}%
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          <div className="font-medium text-primary">
                            {formatNumber(row.xpPaid)} XP
                          </div>
                          <div className="flex items-center justify-end gap-1 text-muted-foreground">
                            <Coins className="h-3 w-3" />
                            {formatNumber(row.coinsPaid)}
                          </div>
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