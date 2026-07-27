/**
 * Motor puro de métricas do ranking coletivo (multi-campanha).
 *
 * Mantido sem dependência de rede/React para ser determinístico e testável:
 * recebe equipes + campanhas já carregadas e devolve agregações consistentes.
 */

export interface MetricsCampaign {
  id: string;
  name: string;
  metric_unit: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface MetricsTeam {
  id: string;
  campaign_id: string;
  name: string;
  target_team: number;
  progress: number;
  members_count: number;
  awarded_at: string | null;
  xp_awarded: number;
  coins_awarded: number;
  created_at: string;
}

export type PeriodPreset = "all" | "30d" | "90d" | "180d" | "365d" | "year";

export interface PeriodRange {
  /** ISO `YYYY-MM-DD` inclusivo, ou `null` para "sem limite". */
  from: string | null;
  to: string | null;
}

export const PERIOD_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "180d", label: "Últimos 6 meses" },
  { value: "365d", label: "Últimos 12 meses" },
  { value: "year", label: "Ano corrente" },
  { value: "all", label: "Todo o histórico" },
];

/** Normaliza para `YYYY-MM-DD` em horário local, evitando deslocamento de fuso. */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Converte o preset em uma janela concreta (referência injetável para testes). */
export function resolvePeriod(preset: PeriodPreset, reference: Date = new Date()): PeriodRange {
  const to = toISODate(reference);
  if (preset === "all") return { from: null, to: null };
  if (preset === "year") return { from: `${reference.getFullYear()}-01-01`, to };
  const days = preset === "30d" ? 30 : preset === "90d" ? 90 : preset === "180d" ? 180 : 365;
  const start = new Date(reference.getTime());
  start.setDate(start.getDate() - days);
  return { from: toISODate(start), to };
}

/** Uma campanha entra no recorte quando sua vigência intersecta a janela. */
export function campaignInPeriod(campaign: MetricsCampaign, range: PeriodRange): boolean {
  const start = (campaign.start_date ?? "").slice(0, 10);
  const end = (campaign.end_date ?? "").slice(0, 10) || start;
  if (!start) return range.from === null;
  if (range.from && end && end < range.from) return false;
  if (range.to && start > range.to) return false;
  return true;
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export interface TeamMetricRow {
  team: MetricsTeam;
  campaign: MetricsCampaign | null;
  /** Contribuição absoluta da equipe na métrica da campanha. */
  contribution: number;
  target: number;
  /** 0-100, limitado para não distorcer o ranking com metas simbólicas. */
  progressPercent: number;
  reachedGoal: boolean;
  membersCount: number;
  /** Contribuição média por participante — desempata equipes de tamanhos diferentes. */
  contributionPerMember: number;
  xpPaid: number;
  coinsPaid: number;
  paid: boolean;
}

export interface TeamMetricsSummary {
  teams: number;
  campaigns: number;
  members: number;
  contribution: number;
  target: number;
  /** Média simples do atingimento das equipes (0-100). */
  averageProgress: number;
  goalsReached: number;
  xpPaid: number;
  coinsPaid: number;
  teamsPaid: number;
}

/** Constrói as linhas do ranking, ordenadas por contribuição (desempate estável). */
export function buildTeamMetrics(
  teams: MetricsTeam[],
  campaigns: MetricsCampaign[],
  membersCount: Map<string, number> = new Map(),
): TeamMetricRow[] {
  const byCampaign = new Map(campaigns.map((c) => [c.id, c]));
  return teams
    .map((team) => {
      const contribution = safeNumber(team.progress);
      const target = safeNumber(team.target_team);
      const members = Math.max(
        0,
        Math.trunc(membersCount.get(team.id) ?? safeNumber(team.members_count)),
      );
      const progressPercent = target > 0 ? Math.min(100, (contribution / target) * 100) : 0;
      return {
        team,
        campaign: byCampaign.get(team.campaign_id) ?? null,
        contribution,
        target,
        progressPercent,
        reachedGoal: target > 0 && contribution >= target,
        membersCount: members,
        contributionPerMember: members > 0 ? contribution / members : 0,
        xpPaid: safeNumber(team.xp_awarded),
        coinsPaid: safeNumber(team.coins_awarded),
        paid: !!team.awarded_at,
      };
    })
    .sort(
      (a, b) =>
        b.contribution - a.contribution ||
        b.progressPercent - a.progressPercent ||
        a.team.name.localeCompare(b.team.name, "pt-BR"),
    );
}

/** Consolida os totais exibidos nos cartões do dashboard. */
export function summarizeTeamMetrics(rows: TeamMetricRow[]): TeamMetricsSummary {
  const summary: TeamMetricsSummary = {
    teams: rows.length,
    campaigns: new Set(rows.map((r) => r.team.campaign_id)).size,
    members: 0,
    contribution: 0,
    target: 0,
    averageProgress: 0,
    goalsReached: 0,
    xpPaid: 0,
    coinsPaid: 0,
    teamsPaid: 0,
  };

  rows.forEach((row) => {
    summary.members += row.membersCount;
    summary.contribution += row.contribution;
    summary.target += row.target;
    summary.averageProgress += row.progressPercent;
    if (row.reachedGoal) summary.goalsReached += 1;
    summary.xpPaid += row.xpPaid;
    summary.coinsPaid += row.coinsPaid;
    if (row.paid) summary.teamsPaid += 1;
  });

  summary.averageProgress = rows.length > 0 ? summary.averageProgress / rows.length : 0;
  return summary;
}