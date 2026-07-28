/**
 * Seleção pura do mercado de Aposta de Meta que representa uma campanha.
 *
 * Uma mesma campanha pode ter mais de um mercado ao longo do tempo (rascunho
 * abandonado, mercado anulado, nova rodada). A vitrine precisa escolher um
 * único, sempre o mesmo, sem consultar o servidor de novo.
 *
 * Invariantes cobertas por src/test/goalBetShowcase.test.ts:
 *   V1. Só entram mercados cujo título é da campanha exata (sem colisão parcial).
 *   V2. Prioridade: aberto > travado > apurado/anulado > rascunho.
 *   V3. Empate de prioridade resolve pelo travamento mais recente e, por fim,
 *       pelo id — determinístico.
 */

import { extractGoalBetCampaignName } from "./goalBetSettlement";

export interface GoalBetShowcaseMarket {
  id: string;
  title: string;
  status: string;
  locks_at: string;
}

/** Menor número = mais relevante para o colaborador. */
const STATUS_PRIORITY: Record<string, number> = {
  open: 0,
  locked: 1,
  settled: 2,
  voided: 3,
  draft: 4,
};

function priority(status: string): number {
  return STATUS_PRIORITY[status] ?? 5;
}

export function goalBetMarketsForCampaign<T extends GoalBetShowcaseMarket>(
  markets: readonly T[],
  campaignName: string,
): T[] {
  const target = campaignName.trim();
  if (target.length === 0) return [];
  return markets.filter((m) => extractGoalBetCampaignName(m.title) === target);
}

/** Mercado em destaque da campanha, ou `null` quando não existe nenhum. */
export function pickGoalBetMarket<T extends GoalBetShowcaseMarket>(
  markets: readonly T[],
  campaignName: string,
): T | null {
  const matches = goalBetMarketsForCampaign(markets, campaignName).sort((a, b) => {
    const byStatus = priority(a.status) - priority(b.status);
    if (byStatus !== 0) return byStatus;
    const at = new Date(a.locks_at).getTime();
    const bt = new Date(b.locks_at).getTime();
    if (Number.isFinite(at) && Number.isFinite(bt) && at !== bt) return bt - at;
    return a.id.localeCompare(b.id);
  });
  return matches[0] ?? null;
}