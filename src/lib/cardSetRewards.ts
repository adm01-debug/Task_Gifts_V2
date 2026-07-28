/**
 * Motor puro das **recompensas de coleção** do Álbum de Cartas.
 *
 * Espelha exatamente a RPC `claim_card_set_reward` (`SECURITY DEFINER`),
 * permitindo simular centenas de cenários sem tocar no banco.
 *
 * Decisões de projeto (o "porquê" antes do "como"):
 *
 * 1. **Marcos progressivos, não prêmio único.** Um prêmio só na conclusão
 *    100% concentra toda a gratificação num evento raro; a maior parte dos
 *    colecionadores abandona antes. Quatro marcos (25/50/75/100%) devolvem
 *    reforço ao longo do caminho, com a maior fatia reservada ao final para
 *    que o incentivo marginal cresça — nunca decresça — perto da conclusão.
 * 2. **Valor derivado da composição real do conjunto**, não de um número
 *    digitado no admin. Se amanhã entrarem duas lendárias no set, a
 *    recompensa acompanha a dificuldade automaticamente.
 * 3. **Soma exata.** A divisão em marcos usa maior-resto, garantindo que a
 *    soma dos quatro marcos seja idêntica à recompensa total do conjunto —
 *    sem centavos de moeda criados ou destruídos pelo arredondamento.
 * 4. **Idempotência por chave determinística**: o mesmo usuário, conjunto e
 *    marco produzem sempre a mesma `dedupe_key`, o que torna o resgate
 *    seguro sob duplo clique, retry de rede e reprocessamento.
 *
 * Este módulo NUNCA credita moedas em produção — quem credita é o servidor.
 */

import { RARITY_VALUE, isCardRarity, type CardDefinition, type CardRarity, type OwnedCard } from "./tradingCards";

/** Marcos de conclusão, em pontos percentuais de cartas distintas obtidas. */
export const SET_MILESTONES = [25, 50, 75, 100] as const;
export type SetMilestone = (typeof SET_MILESTONES)[number];

/**
 * Fatia de cada marco sobre a recompensa total do conjunto.
 * Crescente de propósito: o esforço por carta nova cresce no fim (restam só
 * as raras que ninguém tem), então o prêmio precisa crescer junto.
 */
const MILESTONE_SHARE: Readonly<Record<SetMilestone, number>> = {
  25: 0.1,
  50: 0.2,
  75: 0.3,
  100: 0.4,
};

/** Conversão de "pontos de valor" (raridade) em moedas e XP. */
export const COINS_PER_VALUE_POINT = 5;
export const XP_PER_VALUE_POINT = 3;

export interface SetMilestoneReward {
  milestone: SetMilestone;
  coins: number;
  xp: number;
  /** Quantas cartas distintas são necessárias para atingir o marco. */
  cardsRequired: number;
  reached: boolean;
  claimed: boolean;
  /** Atingido e ainda não resgatado. */
  claimable: boolean;
}

export interface SetProgress {
  setCode: string;
  totalCards: number;
  ownedCards: number;
  completionPct: number;
  /** Soma dos valores de raridade das cartas ativas do conjunto. */
  setValue: number;
  totalCoins: number;
  totalXp: number;
  milestones: SetMilestoneReward[];
  claimableCoins: number;
  claimableXp: number;
  isComplete: boolean;
}

export interface SetRewardClaim {
  set_code: string;
  milestone: number;
}

function safeQuantity(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
  return n > 0 ? n : 0;
}

function rarityValue(rarity: CardRarity): number {
  const v = RARITY_VALUE[rarity];
  return Number.isFinite(v) && v > 0 ? v : 0;
}

/**
 * Divide `total` entre os marcos pelas fatias configuradas, com maior-resto.
 * Invariante: a soma do resultado é **exatamente** `total`.
 */
export function splitByMilestone(total: number): Record<SetMilestone, number> {
  const base = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
  const raw = SET_MILESTONES.map((m) => ({ m, exact: base * MILESTONE_SHARE[m] }));
  const floors = raw.map((r) => ({ ...r, floor: Math.floor(r.exact), rest: r.exact - Math.floor(r.exact) }));
  let remainder = base - floors.reduce((sum, r) => sum + r.floor, 0);

  // Desempate determinístico: maior resto primeiro; empate resolvido pelo
  // marco mais alto, mantendo a curva crescente de recompensa.
  const order = [...floors].sort((a, b) => (b.rest - a.rest) || (b.m - a.m));
  const bonus = new Map<SetMilestone, number>();
  for (const item of order) {
    if (remainder <= 0) break;
    bonus.set(item.m, 1);
    remainder -= 1;
  }

  return SET_MILESTONES.reduce(
    (acc, m) => {
      const entry = floors.find((f) => f.m === m);
      acc[m] = (entry?.floor ?? 0) + (bonus.get(m) ?? 0);
      return acc;
    },
    {} as Record<SetMilestone, number>,
  );
}

/** Cartas distintas necessárias para atingir o marco (arredondamento para cima). */
export function cardsRequiredFor(totalCards: number, milestone: SetMilestone): number {
  if (!Number.isFinite(totalCards) || totalCards <= 0) return 0;
  return Math.ceil((Math.floor(totalCards) * milestone) / 100);
}

/** Chave determinística de idempotência do resgate. Igual à usada na RPC. */
export function setRewardDedupeKey(userId: string, setCode: string, milestone: SetMilestone): string {
  return `card_set:${userId}:${setCode}:${milestone}`;
}

/**
 * Consolida o progresso de cada conjunto e o estado de resgate dos marcos.
 * Tolerante a dados corrompidos: cartas inativas, raridade inválida,
 * quantidades negativas e resgates desconhecidos são descartados em silêncio.
 */
export function summarizeSetRewards(
  pool: readonly CardDefinition[],
  owned: readonly OwnedCard[],
  claims: readonly SetRewardClaim[] = [],
): SetProgress[] {
  const quantities = new Map<string, number>();
  for (const row of owned) {
    const qty = safeQuantity(row?.quantity);
    if (qty <= 0 || typeof row.card_id !== "string") continue;
    quantities.set(row.card_id, (quantities.get(row.card_id) ?? 0) + qty);
  }

  const claimed = new Set(
    claims
      .filter((c) => typeof c?.set_code === "string" && (SET_MILESTONES as readonly number[]).includes(c.milestone))
      .map((c) => `${c.set_code}#${c.milestone}`),
  );

  const sets = new Map<string, { total: number; owned: number; value: number }>();
  for (const card of pool) {
    if (!card?.is_active || !isCardRarity(card.rarity) || typeof card.set_code !== "string") continue;
    const bucket = sets.get(card.set_code) ?? { total: 0, owned: 0, value: 0 };
    bucket.total += 1;
    bucket.value += rarityValue(card.rarity);
    if ((quantities.get(card.id) ?? 0) > 0) bucket.owned += 1;
    sets.set(card.set_code, bucket);
  }

  return [...sets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([setCode, bucket]) => {
      const totalCoins = bucket.value * COINS_PER_VALUE_POINT;
      const totalXp = bucket.value * XP_PER_VALUE_POINT;
      const coinSplit = splitByMilestone(totalCoins);
      const xpSplit = splitByMilestone(totalXp);

      const milestones = SET_MILESTONES.map<SetMilestoneReward>((milestone) => {
        // Comparação inteira: evita que 3/4 == 74,999...% perca o marco.
        const reached = bucket.total > 0 && bucket.owned * 100 >= milestone * bucket.total;
        const isClaimed = claimed.has(`${setCode}#${milestone}`);
        return {
          milestone,
          coins: coinSplit[milestone],
          xp: xpSplit[milestone],
          cardsRequired: cardsRequiredFor(bucket.total, milestone),
          reached,
          claimed: isClaimed,
          claimable: reached && !isClaimed,
        };
      });

      return {
        setCode,
        totalCards: bucket.total,
        ownedCards: bucket.owned,
        completionPct:
          bucket.total === 0 ? 0 : Math.round((bucket.owned / bucket.total) * 1000) / 10,
        setValue: bucket.value,
        totalCoins,
        totalXp,
        milestones,
        claimableCoins: milestones.filter((m) => m.claimable).reduce((s, m) => s + m.coins, 0),
        claimableXp: milestones.filter((m) => m.claimable).reduce((s, m) => s + m.xp, 0),
        isComplete: bucket.total > 0 && bucket.owned >= bucket.total,
      };
    });
}

export type SetClaimRejection = "unknown_set" | "empty_set" | "not_reached" | "already_claimed";

export interface SetClaimVerdict {
  ok: boolean;
  reason?: SetClaimRejection;
  coins: number;
  xp: number;
}

/** Veredito de um resgate específico — mesma ordem de checagem da RPC. */
export function checkSetClaim(
  progressList: readonly SetProgress[],
  setCode: string,
  milestone: SetMilestone,
): SetClaimVerdict {
  const progress = progressList.find((p) => p.setCode === setCode);
  if (!progress) return { ok: false, reason: "unknown_set", coins: 0, xp: 0 };
  if (progress.totalCards === 0) return { ok: false, reason: "empty_set", coins: 0, xp: 0 };

  const entry = progress.milestones.find((m) => m.milestone === milestone);
  if (!entry) return { ok: false, reason: "unknown_set", coins: 0, xp: 0 };
  if (!entry.reached) return { ok: false, reason: "not_reached", coins: 0, xp: 0 };
  if (entry.claimed) return { ok: false, reason: "already_claimed", coins: 0, xp: 0 };

  return { ok: true, coins: entry.coins, xp: entry.xp };
}

export const SET_CLAIM_REJECTION_LABEL: Readonly<Record<SetClaimRejection, string>> = {
  unknown_set: "Coleção não encontrada.",
  empty_set: "Esta coleção ainda não tem cartas ativas.",
  not_reached: "Você ainda não atingiu este marco da coleção.",
  already_claimed: "Recompensa já resgatada.",
};

export const SET_LABEL: Readonly<Record<string, string>> = {
  S1: "Temporada 1 — Promo Brindes",
};

export function setLabel(setCode: string): string {
  return SET_LABEL[setCode] ?? `Coleção ${setCode}`;
}