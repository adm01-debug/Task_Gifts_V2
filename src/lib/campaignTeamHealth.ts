/**
 * Motor puro de diagnóstico de saúde das equipes de campanha.
 *
 * Objetivo: antecipar falhas do rateio (`award_campaign_team_split`) ANTES do
 * pagamento — equipes sem membros, metas inválidas, participantes órfãos e
 * membros duplicados produzem rateios silenciosamente incorretos.
 *
 * Sem dependência de rede/React: entrada explícita, saída determinística.
 */

export type TeamHealthSeverity = "critical" | "warning" | "info";

export type TeamHealthCode =
  | "team_without_members"
  | "team_without_target"
  | "team_zero_progress"
  | "duplicate_team_name"
  | "member_in_multiple_teams"
  | "unassigned_participants"
  | "team_already_awarded";

export interface HealthTeam {
  id: string;
  name: string;
  target_team: number;
  progress: number;
  members_count: number;
  awarded_at: string | null;
}

export interface HealthMember {
  team_id: string;
  user_id: string;
}

export interface HealthParticipant {
  user_id: string;
}

export interface TeamHealthIssue {
  code: TeamHealthCode;
  severity: TeamHealthSeverity;
  /** Equipe afetada, quando aplicável. */
  teamId: string | null;
  teamName: string | null;
  /** Mensagem pronta para exibição ao gestor (PT-BR). */
  message: string;
  /** Ids de usuários envolvidos (órfãos, duplicados). */
  userIds: string[];
}

export interface TeamHealthReport {
  issues: TeamHealthIssue[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  /** `true` quando não há impedimento crítico para executar o rateio. */
  readyForSplit: boolean;
  /** Equipes elegíveis ao rateio (com membros, meta válida e ainda não pagas). */
  eligibleTeamIds: string[];
}

const EMPTY_REPORT: TeamHealthReport = {
  issues: [],
  criticalCount: 0,
  warningCount: 0,
  infoCount: 0,
  readyForSplit: false,
  eligibleTeamIds: [],
};

function normalizeName(name: string): string {
  return (name ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function toFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Avalia equipes, membros e participantes e devolve os problemas encontrados.
 * A ordenação é estável: críticos primeiro, depois alertas e informativos.
 */
export function analyzeTeamHealth(
  teams: HealthTeam[],
  members: HealthMember[],
  participants: HealthParticipant[] = [],
): TeamHealthReport {
  const safeTeams = Array.isArray(teams) ? teams : [];
  const safeMembers = Array.isArray(members) ? members : [];
  const safeParticipants = Array.isArray(participants) ? participants : [];

  if (safeTeams.length === 0) return { ...EMPTY_REPORT };

  const teamIds = new Set(safeTeams.map((t) => t.id));
  const issues: TeamHealthIssue[] = [];

  // Membros válidos (pertencentes a equipes existentes), sem duplicatas exatas.
  const seenPair = new Set<string>();
  const membersByTeam = new Map<string, Set<string>>();
  const teamsByUser = new Map<string, Set<string>>();
  for (const m of safeMembers) {
    if (!m || !teamIds.has(m.team_id) || !m.user_id) continue;
    const pair = `${m.team_id}::${m.user_id}`;
    if (seenPair.has(pair)) continue;
    seenPair.add(pair);
    if (!membersByTeam.has(m.team_id)) membersByTeam.set(m.team_id, new Set());
    membersByTeam.get(m.team_id)!.add(m.user_id);
    if (!teamsByUser.has(m.user_id)) teamsByUser.set(m.user_id, new Set());
    teamsByUser.get(m.user_id)!.add(m.team_id);
  }

  const nameBuckets = new Map<string, HealthTeam[]>();
  const eligibleTeamIds: string[] = [];

  for (const team of safeTeams) {
    const memberCount = membersByTeam.get(team.id)?.size ?? 0;
    const target = toFiniteNumber(team.target_team);
    const progress = toFiniteNumber(team.progress);
    const awarded = !!team.awarded_at;

    if (memberCount === 0) {
      issues.push({
        code: "team_without_members",
        severity: "critical",
        teamId: team.id,
        teamName: team.name,
        message: `A equipe "${team.name}" não possui membros — o rateio será ignorado e nenhum XP/moeda será distribuído.`,
        userIds: [],
      });
    }

    if (target <= 0) {
      issues.push({
        code: "team_without_target",
        severity: "critical",
        teamId: team.id,
        teamName: team.name,
        message: `A equipe "${team.name}" está sem meta coletiva válida (${target}). Defina uma meta maior que zero antes do rateio.`,
        userIds: [],
      });
    }

    if (memberCount > 0 && target > 0 && progress <= 0 && !awarded) {
      issues.push({
        code: "team_zero_progress",
        severity: "warning",
        teamId: team.id,
        teamName: team.name,
        message: `A equipe "${team.name}" ainda não registrou nenhum resultado importado.`,
        userIds: [],
      });
    }

    if (awarded) {
      issues.push({
        code: "team_already_awarded",
        severity: "info",
        teamId: team.id,
        teamName: team.name,
        message: `A equipe "${team.name}" já recebeu o rateio e será pulada em novas execuções.`,
        userIds: [],
      });
    }

    if (memberCount > 0 && target > 0 && !awarded) eligibleTeamIds.push(team.id);

    const key = normalizeName(team.name);
    if (key) {
      if (!nameBuckets.has(key)) nameBuckets.set(key, []);
      nameBuckets.get(key)!.push(team);
    }
  }

  for (const [, bucket] of nameBuckets) {
    if (bucket.length < 2) continue;
    issues.push({
      code: "duplicate_team_name",
      severity: "warning",
      teamId: bucket[0].id,
      teamName: bucket[0].name,
      message: `Existem ${bucket.length} equipes com o nome "${bucket[0].name}" — o ranking e a auditoria ficam ambíguos.`,
      userIds: [],
    });
  }

  const multi = [...teamsByUser.entries()]
    .filter(([, set]) => set.size > 1)
    .map(([userId]) => userId)
    .sort();
  if (multi.length > 0) {
    issues.push({
      code: "member_in_multiple_teams",
      severity: "critical",
      teamId: null,
      teamName: null,
      message: `${multi.length} colaborador(es) estão alocados em mais de uma equipe e receberiam o rateio em duplicidade.`,
      userIds: multi,
    });
  }

  const assigned = new Set(teamsByUser.keys());
  const orphans = safeParticipants
    .map((p) => p?.user_id)
    .filter((id): id is string => !!id)
    .filter((id, idx, arr) => arr.indexOf(id) === idx)
    .filter((id) => !assigned.has(id))
    .sort();
  if (orphans.length > 0) {
    issues.push({
      code: "unassigned_participants",
      severity: "warning",
      teamId: null,
      teamName: null,
      message: `${orphans.length} participante(s) da campanha não pertencem a nenhuma equipe e ficarão de fora do rateio coletivo.`,
      userIds: orphans,
    });
  }

  const rank: Record<TeamHealthSeverity, number> = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => rank[a.severity] - rank[b.severity]);

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  return {
    issues,
    criticalCount,
    warningCount,
    infoCount,
    readyForSplit: criticalCount === 0 && eligibleTeamIds.length > 0,
    eligibleTeamIds,
  };
}

/** Resumo curto para toasts e alertas de gestor. */
export function summarizeTeamHealth(report: TeamHealthReport): string {
  if (report.issues.length === 0) return "Todas as equipes estão prontas para o rateio.";
  const parts: string[] = [];
  if (report.criticalCount > 0) parts.push(`${report.criticalCount} bloqueio(s)`);
  if (report.warningCount > 0) parts.push(`${report.warningCount} alerta(s)`);
  if (report.infoCount > 0) parts.push(`${report.infoCount} informativo(s)`);
  return parts.join(" · ");
}
