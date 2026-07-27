/**
 * Motor de referência do rateio coletivo (`team_split`) das campanhas de vendas.
 *
 * Esta é uma reimplementação determinística e pura (sem I/O) da RPC
 * `award_campaign_team_split` + `recalc_campaign_teams`. Ela existe para que o
 * comportamento do rateio possa ser simulado em centenas de cenários no CI,
 * cobrindo equipes vazias, empates, contribuição zero e reentrância do
 * pagamento — sem depender de um banco real.
 *
 * Qualquer mudança na função SQL DEVE ser refletida aqui (e vice-versa).
 */

/** Modo de divisão do prêmio coletivo. */
export type TeamShareMode = "proportional" | "equal";

/** Regra de rateio persistida em `sales_campaigns.split_rule`. */
export interface TeamSplitRule {
  team_pool_xp?: number | string | null;
  team_pool_coins?: number | string | null;
  team_share?: string | null;
}

/** Participante da campanha (fonte do progresso individual). */
export interface SimParticipant {
  user_id: string;
  progress: number;
}

/** Equipe da campanha, no estado persistido. */
export interface SimTeam {
  id: string;
  name: string;
  target_team: number;
  /** Ordem de criação — desempate determinístico do ranking. */
  created_at: number;
  member_ids: string[];
  /** Preenchido após um rateio bem-sucedido; garante idempotência. */
  awarded_at: string | null;
  xp_awarded?: number;
  coins_awarded?: number;
  /** Campos derivados por `recalcCampaignTeams`. */
  progress?: number;
  members_count?: number;
  progress_percent?: number;
  rank_position?: number | null;
}

/** Estado completo da campanha usado pela simulação. */
export interface SimCampaignState {
  rule: TeamSplitRule | null;
  teams: SimTeam[];
  participants: SimParticipant[];
  /** Saldos acumulados por usuário (espelha `profiles` + `campaign_participants`). */
  balances: Record<string, { xp: number; coins: number }>;
  notifications: Array<{ user_id: string; team_id: string; xp: number; coins: number }>;
}

export interface TeamSplitOutcome {
  teams_awarded: number;
  members_awarded: number;
  reason?: "empty_pool" | "campaign_not_found";
}

/**
 * `ROUND()` do Postgres em NUMERIC arredonda "half away from zero",
 * diferente do `Math.round` do JS (half up, que erra em negativos).
 */
export function pgRound(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value >= 0 ? Math.floor(value + 0.5) : -Math.floor(-value + 0.5);
}

/** Coerção defensiva de valores vindos de JSONB (podem ser string ou null). */
function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Espelha `recalc_campaign_teams`: progresso, percentual, contagem e ranking. */
export function recalcCampaignTeams(state: SimCampaignState): SimTeam[] {
  return recalcTeamsInternal(state);
}

function recalcTeamsInternal(state: SimCampaignState): SimTeam[] {
  const progressByUser = new Map<string, number>();
  state.participants.forEach((p) => progressByUser.set(p.user_id, p.progress));

  state.teams.forEach((team) => {
    const total = team.member_ids.reduce((sum, uid) => sum + (progressByUser.get(uid) ?? 0), 0);
    team.progress = Math.round(total * 100) / 100;
    team.members_count = team.member_ids.length;
    team.progress_percent =
      team.target_team > 0
        ? Math.min(100, Math.round((team.progress / team.target_team) * 100 * 100) / 100)
        : 0;
  });

  const ranked = [...state.teams].sort(
    (a, b) => (b.progress ?? 0) - (a.progress ?? 0) || a.created_at - b.created_at,
  );
  ranked.forEach((team, index) => {
    team.rank_position = index + 1;
  });

  return ranked;
}

/**
 * Espelha `award_campaign_team_split`. Muta `state` (saldos, notificações e
 * `awarded_at`) exatamente como a RPC faria, permitindo testar reentrância
 * chamando a função múltiplas vezes sobre o mesmo estado.
 */
export function awardCampaignTeamSplit(state: SimCampaignState): TeamSplitOutcome {
  if (!state.rule) {
    return { teams_awarded: 0, members_awarded: 0, reason: "campaign_not_found" };
  }

  recalcCampaignTeams(state);

  const poolXp = toNumber(state.rule.team_pool_xp);
  const poolCoins = toNumber(state.rule.team_pool_coins);
  const mode: TeamShareMode = state.rule.team_share === "equal" ? "equal" : "proportional";

  if (poolXp <= 0 && poolCoins <= 0) {
    return { teams_awarded: 0, members_awarded: 0, reason: "empty_pool" };
  }

  const progressByUser = new Map<string, number>();
  state.participants.forEach((p) => progressByUser.set(p.user_id, p.progress));

  let teamsAwarded = 0;
  let membersAwarded = 0;

  for (const team of state.teams) {
    const teamProgress = team.progress ?? 0;
    const membersCount = team.members_count ?? 0;

    // Elegibilidade: nunca premiada, meta positiva e meta atingida.
    if (team.awarded_at !== null) continue;
    if (team.target_team <= 0) continue;
    if (teamProgress < team.target_team) continue;

    for (const userId of team.member_ids) {
      const memberProgress = progressByUser.get(userId) ?? 0;

      // Empate/contribuição zero: fallback igualitário quando o time não tem
      // progresso mensurável, evitando divisão por zero.
      const share =
        mode === "equal" || teamProgress <= 0
          ? membersCount > 0
            ? 1 / membersCount
            : 0
          : memberProgress / teamProgress;

      const xp = Math.max(0, pgRound(poolXp * share));
      const coins = Math.max(0, pgRound(poolCoins * share));

      if (xp > 0 || coins > 0) {
        const current = state.balances[userId] ?? { xp: 0, coins: 0 };
        state.balances[userId] = { xp: current.xp + xp, coins: current.coins + coins };
        state.notifications.push({ user_id: userId, team_id: team.id, xp, coins });
        membersAwarded += 1;
      }
    }

    team.awarded_at = new Date(0).toISOString();
    team.xp_awarded = pgRound(poolXp);
    team.coins_awarded = pgRound(poolCoins);
    teamsAwarded += 1;
  }

  return { teams_awarded: teamsAwarded, members_awarded: membersAwarded };
}
