/**
 * Motor de referência da reversão de um lote de rateio coletivo
 * (`revert_campaign_team_split`).
 *
 * Puro e determinístico (sem I/O) de propósito: permite simular centenas de
 * cenários no CI — lote já revertido, lote pulado, saldos insuficientes,
 * colaborador removido, reentrância — sem depender de banco real.
 *
 * Qualquer mudança na RPC SQL DEVE ser refletida aqui (e vice-versa).
 */

export type RevertFailure =
  | "batch_not_found"
  | "already_reverted"
  | "nothing_to_revert";

/** Linha auditável relevante para a reversão. */
export interface RevertEntry {
  user_id: string | null;
  team_id: string | null;
  xp_allocated: number;
  coins_allocated: number;
  outcome: string;
}

export interface RevertBatch {
  id: string;
  status: string;
  reverted_at: string | null;
  entries: RevertEntry[];
}

/** Saldos que a reversão debita (espelha `profiles` + `campaign_participants`). */
export interface RevertBalances {
  [userId: string]: { xp: number; coins: number };
}

export interface RevertState {
  batch: RevertBatch | null;
  /** Saldo global do colaborador (tabela `profiles`). */
  profiles: RevertBalances;
  /** Saldo acumulado na campanha (`campaign_participants`). */
  participants: RevertBalances;
  /** Equipes premiadas pelo lote, indexadas por id. */
  teams: Record<string, { awarded_at: string | null; xp_awarded: number; coins_awarded: number }>;
  notifications: Array<{ user_id: string; xp: number; coins: number }>;
}

export interface RevertOutcome {
  reverted: boolean;
  members_reverted: number;
  teams_reset: number;
  xp_reverted: number;
  coins_reverted: number;
  reason?: RevertFailure;
}

/** Debita sem permitir saldo negativo — espelha `GREATEST(0, ...)` no SQL. */
function debit(bucket: RevertBalances, userId: string, xp: number, coins: number): void {
  const current = bucket[userId];
  if (!current) return; // colaborador removido: nada a estornar.
  bucket[userId] = {
    xp: Math.max(0, current.xp - xp),
    coins: Math.max(0, current.coins - coins),
  };
}

function sanitize(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Reverte um lote de rateio: estorna XP/moedas pagos, libera as equipes para
 * novo rateio e marca o lote como revertido. Idempotente por construção.
 */
export function revertCampaignTeamSplit(state: RevertState): RevertOutcome {
  const base: RevertOutcome = {
    reverted: false,
    members_reverted: 0,
    teams_reset: 0,
    xp_reverted: 0,
    coins_reverted: 0,
  };

  const batch = state.batch;
  if (!batch) return { ...base, reason: "batch_not_found" };
  if (batch.reverted_at !== null || batch.status === "reverted") {
    return { ...base, reason: "already_reverted" };
  }

  const paid = batch.entries.filter(
    (e) => e.outcome === "paid" && e.user_id !== null,
  );
  if (paid.length === 0) return { ...base, reason: "nothing_to_revert" };

  let members = 0;
  let xpTotal = 0;
  let coinsTotal = 0;

  for (const entry of paid) {
    const userId = entry.user_id as string;
    const xp = sanitize(entry.xp_allocated);
    const coins = sanitize(entry.coins_allocated);
    if (xp === 0 && coins === 0) continue;

    debit(state.profiles, userId, xp, coins);
    debit(state.participants, userId, xp, coins);
    state.notifications.push({ user_id: userId, xp, coins });

    members += 1;
    xpTotal += xp;
    coinsTotal += coins;
  }

  const teamIds = new Set(
    paid.map((e) => e.team_id).filter((id): id is string => id !== null),
  );
  let teamsReset = 0;
  teamIds.forEach((teamId) => {
    const team = state.teams[teamId];
    if (!team || team.awarded_at === null) return;
    state.teams[teamId] = { awarded_at: null, xp_awarded: 0, coins_awarded: 0 };
    teamsReset += 1;
  });

  batch.reverted_at = new Date(0).toISOString();
  batch.status = "reverted";

  return {
    reverted: true,
    members_reverted: members,
    teams_reset: teamsReset,
    xp_reverted: xpTotal,
    coins_reverted: coinsTotal,
  };
}
